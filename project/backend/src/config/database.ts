import knex from 'knex';
import { logger } from '../utils/logger';

const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'project_management',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
    
    // Run migrations
    await db.migrate.latest();
    logger.info('✅ Database migrations completed');
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export default db;