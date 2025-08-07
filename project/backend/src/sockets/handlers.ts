import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { logger } from '../utils/logger';
import { JWTPayload } from '../types';

export function setupSocketHandlers(io: Server) {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      const user = await db('users')
        .where('id', decoded.userId)
        .first();

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`User connected: ${user.email} (${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${user.id}`);

    // Join project rooms based on user access
    socket.on('join:project', async (projectId: string) => {
      try {
        // Check if user has access to this project
        let hasAccess = false;

        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          hasAccess = true;
        } else {
          // Check if user is assigned to any task in this project
          const assignment = await db('taches as t')
            .leftJoin('tache_utilisateurs as tu', 't.id', 'tu.tache_id')
            .where('t.projet_id', projectId)
            .where('tu.user_id', user.id)
            .first();

          hasAccess = !!assignment;
        }

        if (hasAccess) {
          socket.join(`project:${projectId}`);
          logger.info(`User ${user.email} joined project room: ${projectId}`);
        } else {
          socket.emit('error', { message: 'Access denied to this project' });
        }
      } catch (error) {
        logger.error('Error joining project room:', error);
        socket.emit('error', { message: 'Failed to join project room' });
      }
    });

    // Leave project room
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      logger.info(`User ${user.email} left project room: ${projectId}`);
    });

    // Handle task status updates
    socket.on('task:status:update', async (data: { taskId: string; status: string }) => {
      try {
        const { taskId, status } = data;

        // Verify user has access to this task
        let hasAccess = false;

        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          hasAccess = true;
        } else {
          const assignment = await db('tache_utilisateurs')
            .where('tache_id', taskId)
            .where('user_id', user.id)
            .first();

          hasAccess = !!assignment;
        }

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this task' });
          return;
        }

        // Update task status
        const [task] = await db('taches')
          .where('id', taskId)
          .update({ 
            etat: status,
            updated_at: new Date()
          })
          .returning('*');

        if (task) {
          // Add history entry
          await db('tache_history').insert({
            tache_id: taskId,
            action: 'status_changed',
            description: `Statut changé vers "${status}" par ${user.prenom} ${user.nom}`,
            auteur_id: user.id,
            details: JSON.stringify({ new_value: status }),
            created_at: new Date()
          });

          // Emit to project room
          io.to(`project:${task.projet_id}`).emit('task:updated', task);
          
          logger.info(`Task ${taskId} status updated to ${status} by ${user.email}`);
        }
      } catch (error) {
        logger.error('Error updating task status:', error);
        socket.emit('error', { message: 'Failed to update task status' });
      }
    });

    // Handle typing indicators for comments
    socket.on('comment:typing:start', (data: { taskId: string }) => {
      socket.to(`task:${data.taskId}`).emit('comment:typing', {
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        isTyping: true
      });
    });

    socket.on('comment:typing:stop', (data: { taskId: string }) => {
      socket.to(`task:${data.taskId}`).emit('comment:typing', {
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        isTyping: false
      });
    });

    // Handle user presence
    socket.on('user:presence', (data: { status: 'online' | 'away' | 'offline' }) => {
      // Broadcast user presence to relevant project rooms
      socket.broadcast.emit('user:presence:update', {
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        status: data.status
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${user.email} (${socket.id}) - Reason: ${reason}`);
      
      // Broadcast user offline status
      socket.broadcast.emit('user:presence:update', {
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        status: 'offline'
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.email}:`, error);
    });
  });

  logger.info('Socket.IO handlers configured');
}