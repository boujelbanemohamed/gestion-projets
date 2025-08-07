const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_projets',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running meeting minutes migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '008_create_meeting_minutes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Meeting minutes migration completed successfully!');
    console.log('📋 Created tables:');
    console.log('   - pv_reunions (meeting minutes)');
    console.log('   - pv_projets (meeting minutes to projects mapping)');
    console.log('📊 Created indexes for performance optimization');
    console.log('🔧 Created triggers for automatic timestamp updates');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });
