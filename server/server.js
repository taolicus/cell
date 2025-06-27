// Express app setup
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const setupSocket = require('./network/socket');
const { WORLD_WIDTH, WORLD_HEIGHT } = require('./config');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'client')));

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

// Server setup
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});