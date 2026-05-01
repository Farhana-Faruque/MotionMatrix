require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const prisma = new PrismaClient();
const { markAttendance, getFloorAttendanceSummary } = require('./controllers/attendanceController');
const { auth, authorize } = require('./middleware/auth');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Attach io instance to request for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Attendance compatibility routes for existing frontend calls
app.post('/api/users/attendance/mark', auth, authorize('FLOOR_MANAGER', 'ADMIN', 'OWNER'), markAttendance);
app.get('/api/users/attendance/floor/:floorId/summary', auth, authorize('FLOOR_MANAGER', 'ADMIN', 'OWNER'), getFloorAttendanceSummary);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/floors', require('./routes/floors'));
app.use('/api/cctvs', require('./routes/cctvs'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/overtime', require('./routes/overtime'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/graphs', require('./routes/graphs'));
app.use('/api/production-records', require('./routes/productionRecords'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Store active users
const activeUsers = new Map();

// WebSocket connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = parseInt(decoded.id) || decoded.id;
    socket.userRole = decoded.role;
    socket.userFloor = decoded.assignedFloorId ? parseInt(decoded.assignedFloorId) : null;
    socket.userName = decoded.name;
    console.log(` WebSocket auth successful: userId=${socket.userId}, role=${socket.userRole}, floor=${socket.userFloor}`);
    next();
  } catch (error) {
    console.error(' WebSocket auth error:', error);
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  console.log(` User ${socket.userId} (${socket.userRole}, floor=${socket.userFloor}) connected via WebSocket`);
  activeUsers.set(socket.userId, { socketId: socket.id, role: socket.userRole, floor: socket.userFloor });

  // Join user to their own room
  socket.join(`user_${socket.userId}`);

  // Notify others that user is online
  io.emit('user_online', { userId: socket.userId, role: socket.userRole });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { toId, content } = data;
      const fromId = socket.userId;

      console.log(`\n${'='.repeat(60)}`);
      console.log(` SOCKET MESSAGE RECEIVED`);
      console.log(`Sender: ${socket.userName} (ID: ${fromId}, Role: ${socket.userRole})`);
      console.log(`Recipient ID: ${toId} (Type: ${typeof toId})`);
      console.log(`Content: "${content?.substring(0, 50)}..."`);

      if (!toId || !content) {
        console.warn(' Missing toId or content', { toId, content });
        socket.emit('error', { message: 'Missing toId or content' });
        return;
      }

      // Ensure toId is a number
      const toIdNum = parseInt(toId);
      if (isNaN(toIdNum)) {
        console.error(' Invalid toId:', toId);
        socket.emit('error', { message: 'Invalid recipient ID' });
        return;
      }

      // Get sender info from socket (already authenticated)
      const sender = {
        id: socket.userId,
        role: socket.userRole,
        assignedFloorId: socket.userFloor,
        name: socket.userName
      };

      // Get receiver info from database
      const receiver = await prisma.user.findUnique({ 
        where: { id: toIdNum },
        select: {
          id: true,
          name: true,
          role: true,
          assignedFloorId: true
        }
      });

      if (!receiver) {
        console.error(' Receiver not found:', toIdNum);
        socket.emit('error', { message: 'Recipient not found' });
        return;
      }

      console.log(`Recipient: ${receiver.name} (ID: ${receiver.id}, Role: ${receiver.role})`);

      // Check if message is allowed based on roles and floors
      const isAllowed = checkMessagePermission(sender, receiver);
      if (!isAllowed) {
        console.warn(` Permission DENIED`);
        socket.emit('error', { message: 'You cannot message this user' });
        console.log(`${'='.repeat(60)}\n`);
        return;
      }

      console.log(` Permission CHECK PASSED`);

      // Save message to database
      // Ensure IDs are integers
      const fromIdNum = parseInt(fromId);
      if (isNaN(fromIdNum)) {
        console.error(' Invalid fromId:', fromId);
        socket.emit('error', { message: 'Invalid sender ID' });
        return;
      }

      const message = await prisma.message.create({
        data: {
          fromId: fromIdNum,
          toId: toIdNum,
          content
        },
        include: {
          from: { select: { id: true, name: true, role: true } },
          to: { select: { id: true, name: true, role: true } }
        }
      });

      console.log(` Message SAVED to database (ID: ${message.id})`);

      // Send message to recipient
      const roomName = `user_${toIdNum}`;
      console.log(` Emitting message to room: ${roomName}`);
      io.to(roomName).emit('receive_message', message);
      console.log(` Message EMITTED to recipient's room`);
      
      // Also send to sender (for confirmation/echo)
      socket.emit('receive_message', message);
      console.log(`✅ Message EMITTED to sender for confirmation`);
      console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
      console.error('❌ SOCKET ERROR:', error);
      socket.emit('error', { message: 'Failed to send message: ' + error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { toId } = data;
    io.to(`user_${toId}`).emit('user_typing', { fromId: socket.userId });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    const { toId } = data;
    io.to(`user_${toId}`).emit('user_stopped_typing', { fromId: socket.userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    activeUsers.delete(socket.userId);
    console.log(`❌ User ${socket.userId} disconnected`);
    io.emit('user_offline', { userId: socket.userId });
  });
});

// Helper function to check message permissions
function checkMessagePermission(sender, receiver) {
  if (!sender || !receiver) {
    console.warn('⚠️ checkMessagePermission: missing sender or receiver');
    return false;
  }

  const senderRole = sender.role;
  const receiverRole = receiver.role;
  const senderFloor = sender.assignedFloorId;
  const receiverFloor = receiver.assignedFloorId;

  console.log(`🔐 Checking permission: ${sender.name} (${senderRole}, floor=${senderFloor}) -> ${receiver.name} (${receiverRole}, floor=${receiverFloor})`);

  // ADMIN can message anyone
  if (senderRole === 'ADMIN') {
    console.log(`  Admin -> ${receiverRole}: ✅ ALLOWED`);
    return true;
  }

  // Anyone can message ADMIN
  if (receiverRole === 'ADMIN') {
    console.log(`  ${senderRole} -> Admin: ✅ ALLOWED`);
    return true;
  }

  // OWNER and MANAGER can message: FLOOR_MANAGER, WORKER, and each other
  if (senderRole === 'OWNER' || senderRole === 'MANAGER') {
    const canMessage = ['FLOOR_MANAGER', 'WORKER', 'OWNER', 'MANAGER'].includes(receiverRole);
    console.log(`  ${senderRole} -> ${receiverRole}: ${canMessage ? '✅ ALLOWED' : '❌ DENIED'}`);
    return canMessage;
  }

  // FLOOR_MANAGER can message: WORKER (same floor), OWNER, MANAGER
  if (senderRole === 'FLOOR_MANAGER') {
    if (receiverRole === 'WORKER') {
      const canMessage = receiverFloor === senderFloor;
      console.log(`  Floor Manager -> Worker: ${canMessage ? '✅ ALLOWED (same floor)' : '❌ DENIED (different floor)'}`);
      return canMessage;
    }
    const canMessage = ['OWNER', 'MANAGER', 'FLOOR_MANAGER'].includes(receiverRole);
    console.log(`  Floor Manager -> ${receiverRole}: ${canMessage ? '✅ ALLOWED' : '❌ DENIED'}`);
    return canMessage;
  }

  // WORKER can message: FLOOR_MANAGER (same floor), OWNER, MANAGER
  if (senderRole === 'WORKER') {
    if (receiverRole === 'FLOOR_MANAGER') {
      const canMessage = receiverFloor === senderFloor;
      console.log(`  Worker -> Floor Manager: ${canMessage ? '✅ ALLOWED (same floor)' : '❌ DENIED (different floor)'}`);
      return canMessage;
    }
    const canMessage = ['OWNER', 'MANAGER'].includes(receiverRole);
    console.log(`  Worker -> ${receiverRole}: ${canMessage ? '✅ ALLOWED' : '❌ DENIED'}`);
    return canMessage;
  }

  console.warn(`⚠️ Unknown role or combination: ${senderRole} -> ${receiverRole}`);
  return false;
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
