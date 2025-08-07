/*
  # Project Deadline Alerts

  1. New Table
    - `projet_alert_settings` - Stores project-specific alert thresholds

  2. Security
    - RLS enabled
    - Appropriate policies for each role
*/

-- Create project alert settings table
CREATE TABLE IF NOT EXISTS projet_alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    threshold_days INTEGER NOT NULL DEFAULT 7,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(projet_id, user_id)
);

-- Enable RLS
ALTER TABLE projet_alert_settings ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_projet_alert_settings_updated_at BEFORE UPDATE ON projet_alert_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index
CREATE INDEX IF NOT EXISTS idx_projet_alert_settings_projet_id ON projet_alert_settings(projet_id);
CREATE INDEX IF NOT EXISTS idx_projet_alert_settings_user_id ON projet_alert_settings(user_id);

-- RLS Policies
CREATE POLICY "Users can manage their own alert settings"
    ON projet_alert_settings FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all alert settings"
    ON projet_alert_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Create global settings table
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
CREATE POLICY "Anyone can view global settings"
    ON global_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage global settings"
    ON global_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Insert default global settings
INSERT INTO global_settings (key, value, description)
VALUES (
    'default_alert_settings',
    '{"threshold_days": 7, "notifications_enabled": true, "email_notifications_enabled": false}',
    'Default settings for project deadline alerts'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    read BOOLEAN DEFAULT false,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
    ON notifications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Function to create deadline notifications
CREATE OR REPLACE FUNCTION create_deadline_notifications()
RETURNS void AS $$
DECLARE
    project_record RECORD;
    user_record RECORD;
    days_until_deadline INTEGER;
    notification_title TEXT;
    notification_message TEXT;
    default_threshold INTEGER;
BEGIN
    -- Get default threshold from global settings
    SELECT (value->>'threshold_days')::INTEGER INTO default_threshold
    FROM global_settings
    WHERE key = 'default_alert_settings';
    
    IF default_threshold IS NULL THEN
        default_threshold := 7; -- Fallback default
    END IF;
    
    -- Loop through active projects with end dates
    FOR project_record IN 
        SELECT p.id, p.nom, p.date_fin
        FROM projets p
        WHERE p.date_fin IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM taches t
            WHERE t.projet_id = p.id
            AND t.etat != 'cloturee'
        )
    LOOP
        -- Calculate days until deadline
        days_until_deadline := EXTRACT(DAY FROM (project_record.date_fin - CURRENT_DATE));
        
        -- Check if project is approaching deadline or overdue
        IF days_until_deadline <= default_threshold AND days_until_deadline >= 0 THEN
            notification_title := 'Alerte : Projet ' || project_record.nom || ' arrive à échéance';
            
            IF days_until_deadline = 0 THEN
                notification_message := 'Le projet ' || project_record.nom || ' se termine aujourd''hui. Veuillez prendre les mesures nécessaires.';
            ELSE
                notification_message := 'Le projet ' || project_record.nom || ' se termine dans ' || days_until_deadline || ' jour(s), le ' || 
                                       to_char(project_record.date_fin, 'DD/MM/YYYY') || '. Veuillez prendre les mesures nécessaires.';
            END IF;
            
            -- Create notifications for all users assigned to the project
            FOR user_record IN
                SELECT DISTINCT u.id
                FROM users u
                JOIN tache_utilisateurs tu ON u.id = tu.user_id
                JOIN taches t ON tu.tache_id = t.id
                WHERE t.projet_id = project_record.id
            LOOP
                -- Check if user has a custom threshold
                DECLARE
                    user_threshold INTEGER;
                BEGIN
                    SELECT threshold_days INTO user_threshold
                    FROM projet_alert_settings
                    WHERE projet_id = project_record.id
                    AND user_id = user_record.id;
                    
                    -- Only create notification if within user's threshold or using default
                    IF user_threshold IS NULL OR days_until_deadline <= user_threshold THEN
                        INSERT INTO notifications (user_id, title, message, type, link)
                        VALUES (
                            user_record.id,
                            notification_title,
                            notification_message,
                            'deadline_approaching',
                            '/project/' || project_record.id
                        );
                    END IF;
                END;
            END LOOP;
        ELSIF days_until_deadline < 0 THEN
            -- Project is overdue
            notification_title := 'Alerte : Projet ' || project_record.nom || ' en retard';
            notification_message := 'Le projet ' || project_record.nom || ' a dépassé sa date d''échéance de ' || ABS(days_until_deadline) || 
                                   ' jour(s). La date de fin était le ' || to_char(project_record.date_fin, 'DD/MM/YYYY') || 
                                   '. Veuillez prendre les mesures nécessaires.';
            
            -- Create notifications for all users assigned to the project
            FOR user_record IN
                SELECT DISTINCT u.id
                FROM users u
                JOIN tache_utilisateurs tu ON u.id = tu.user_id
                JOIN taches t ON tu.tache_id = t.id
                WHERE t.projet_id = project_record.id
            LOOP
                INSERT INTO notifications (user_id, title, message, type, link)
                VALUES (
                    user_record.id,
                    notification_title,
                    notification_message,
                    'deadline_overdue',
                    '/project/' || project_record.id
                );
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called by a cron job or trigger
COMMENT ON FUNCTION create_deadline_notifications() IS 'Creates notifications for projects approaching or past their deadline';