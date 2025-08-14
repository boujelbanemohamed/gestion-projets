import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import departmentRoutes from './routes/departments';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import commentRoutes from './routes/comments';
import uploadRoutes from './routes/uploads';
import notificationRoutes from './routes/notifications';
import performanceRoutes from './routes/performance';
import expenseRoutes from './routes/expenses';
import rubriquesRouter from './routes/rubriques';
import meetingMinutesRoutes from './routes/meetingMinutes';

// Socket handlers
import { setupSocketHandlers } from './sockets/handlers';

dotenv.config();

console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
console.log('🔧 Loading routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes loaded');
app.use('/api/users', userRoutes);
console.log('✅ User routes loaded');
app.use('/api/departments', departmentRoutes);
console.log('✅ Department routes loaded');
app.use('/api/projects', projectRoutes);
console.log('✅ Project routes loaded');
app.use('/api/tasks', taskRoutes);
console.log('✅ Task routes loaded');
app.use('/api/comments', commentRoutes);
console.log('✅ Comment routes loaded');
app.use('/api/uploads', uploadRoutes);
console.log('✅ Upload routes loaded');
app.use('/api/notifications', notificationRoutes);
console.log('✅ Notification routes loaded');
app.use('/api/performance', performanceRoutes);
console.log('✅ Performance routes loaded');
app.use('/api/expenses', expenseRoutes);
console.log('✅ Expense routes loaded');
app.use('/api/rubriques', rubriquesRouter);
console.log('✅ Rubriques routes loaded');
app.use('/api/meeting-minutes', meetingMinutesRoutes);
console.log('✅ Meeting minutes routes loaded');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    routes: 'Routes are loaded successfully'
  });
});

// Socket.IO setup
setupSocketHandlers(io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    // 1) Démarrer le serveur immédiatement pour éviter qu'il ne soit tué avant les logs
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });

    // 2) Puis tenter la connexion DB de façon asynchrone, avec logs détaillés
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUser = process.env.DB_USER;
    const dbName = process.env.DB_NAME;
    logger.info(
      `🧩 Preparing DB connection with env → host=${dbHost}, port=${dbPort}, user=${dbUser}, db=${dbName}`
    );

    connectDatabase()
      .then(() => {
        logger.info('✅ Database connected successfully (async)');
      })
      .catch((err) => {
        logger.error('❌ Database connection failed (non-blocking):', err);
        console.error('❌ Database connection failed (non-blocking):', err);
      });
  } catch (error) {
    logger.error('Failed to start server (runtime):', error);
    console.error('Failed to start server (runtime):', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

export { io };
