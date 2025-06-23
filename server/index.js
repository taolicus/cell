const http = require('http');
const app = require('./app');
const setupSocket = require('./socket');
const { WORLD_WIDTH, WORLD_HEIGHT } = require('./config');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});