import knex from 'knex';
import { logger } from '../utils/logger';

const isProd = process.env.NODE_ENV === 'production';
// Utiliser 5432 par défaut en prod si DB_PORT n'est pas défini
const resolvedPort = parseInt(process.env.DB_PORT || '5432');
const resolvedDbName = process.env.DB_NAME || (isProd ? 'postgres' : 'project_management');

const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: resolvedPort,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: resolvedDbName,
    ssl: isProd ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

export const db = knex(config);

export async function connectDatabase() {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Database connected successfully');
    logger.info(
      `📦 DB target → host: ${process.env.DB_HOST || 'localhost'} | port: ${resolvedPort} | database: ${resolvedDbName} | ssl: ${isProd ? 'on' : 'off'}`
    );
    
    // Run migrations conditionnellement
    const shouldRunMigrations = process.env.RUN_MIGRATIONS === 'true';
    if (shouldRunMigrations) {
      logger.info('🛠️ Running database migrations...');
      await db.migrate.latest();
      logger.info('✅ Database migrations completed');

      if (process.env.RUN_SEEDS === 'true') {
        logger.info('🌱 Running seeds...');
        await db.seed.run();
        logger.info('✅ Seeds completed');
      }
    } else {
      logger.info('⏭️ Skipping migrations (RUN_MIGRATIONS != true)');
    }
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export default db;