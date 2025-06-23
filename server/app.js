// Express app setup
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

module.exports = app;