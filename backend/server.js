const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables (look in backend/.env or root .env)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const incidentsRoutes = require('./routes/incidents');
const teamsRoutes = require('./routes/teams');
const zonesRoutes = require('./routes/zones');
const resourcesRoutes = require('./routes/resources');
const findingsRoutes = require('./routes/findings');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for real-time SAR events
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

const mongoose = require('mongoose');

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health & status endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'RESQ COMMAND API is running (Node.js/Express)',
    status: 'online',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'healthy' : 'degraded',
    database: isConnected ? 'connected' : 'disconnected',
    runtime: 'Node.js ' + process.version,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/findings', findingsRoutes);

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to live SAR stream: ${socket.id}`);

  // Handle live team location updates from field units
  socket.on('team:location_update', (data) => {
    socket.broadcast.emit('team:location_updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ detail: `Route ${req.originalUrl} not found` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ detail: 'Internal Server Error' });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RESQ COMMAND Node.js Server listening on http://127.0.0.1:${PORT}`);
});
