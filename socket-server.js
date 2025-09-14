// Simple Socket.IO server for testing the monster tracker
// Run this file separately with: node server.js
// Make sure to install socket.io first: npm install socket.io

const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

const monsterTypes = ['Griffin', 'Dragon', 'Orc', 'Goblin', 'Troll', 'Skeleton', 'Zombie', 'Vampire', 'Werewolf', 'Phoenix'];

// Generate random monster
const generateRandomMonster = () => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  monster: monsterTypes[Math.floor(Math.random() * monsterTypes.length)],
  level: Math.floor(Math.random() * 10) + 1,
  x: (Math.random() - 0.5) * 800, // Random x between -400 and 400
  y: (Math.random() - 0.5) * 600, // Random y between -300 and 300
  timestamp: Date.now()
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send a welcome message
  socket.emit('monster:spawn', generateRandomMonster());

  // Simulate random monster spawns every 5-15 seconds
  const spawnInterval = setInterval(() => {
    if (Math.random() > 0.3) { // 70% chance to spawn
      const monster = generateRandomMonster();
      console.log('Spawning monster:', monster);
      io.emit('monster:spawn', monster);
    }
  }, Math.random() * 10000 + 5000); // 5-15 seconds

  // Handle room joining (for future map-based filtering)
  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave:room', (roomId) => {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(spawnInterval);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log('CORS enabled for http://localhost:3000');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
