-- Table de logs pour diagnostic des erreurs
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL DEFAULT 'INFO', -- DEBUG, INFO, WARN, ERROR, FATAL
  message TEXT NOT NULL,
  context VARCHAR(255),
  error_type VARCHAR(50),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  stack_trace TEXT,
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_context ON logs(context);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_error_type ON logs(error_type);

-- Fonction pour nettoyer les anciens logs (garder 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_logs_updated_at
  BEFORE UPDATE ON logs
  FOR EACH ROW
  EXECUTE FUNCTION update_logs_updated_at();

-- Insertion de logs de test
INSERT INTO logs (level, message, context, error_type, additional_data) VALUES
('INFO', 'Table logs créée avec succès', 'SYSTEM', 'SETUP', '{"version": "1.0", "action": "table_creation"}'),
('DEBUG', 'Diagnostic des erreurs activé', 'SYSTEM', 'DEBUG', '{"feature": "error_logging", "status": "enabled"}');

-- Vue pour les erreurs récentes (24h)
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  id,
  level,
  message,
  context,
  error_type,
  user_id,
  created_at,
  additional_data
FROM logs 
WHERE level IN ('ERROR', 'FATAL') 
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Vue pour les statistiques d'erreurs
CREATE OR REPLACE VIEW error_stats AS
SELECT 
  level,
  error_type,
  context,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence,
  MIN(created_at) as first_occurrence
FROM logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY level, error_type, context
ORDER BY count DESC;

-- Commentaires pour documentation
COMMENT ON TABLE logs IS 'Table de logs centralisée pour le diagnostic des erreurs et le monitoring';
COMMENT ON COLUMN logs.level IS 'Niveau de log: DEBUG, INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN logs.message IS 'Message principal du log';
COMMENT ON COLUMN logs.context IS 'Contexte où l''erreur s''est produite (ex: Dashboard.loadTasks)';
COMMENT ON COLUMN logs.error_type IS 'Type d''erreur (ex: AUTHENTICATION, NETWORK, DATABASE)';
COMMENT ON COLUMN logs.additional_data IS 'Données supplémentaires en format JSON';
COMMENT ON VIEW recent_errors IS 'Vue des erreurs des dernières 24 heures';
COMMENT ON VIEW error_stats IS 'Statistiques des erreurs des 7 derniers jours';
