// Logging utilities
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = process.env.LOG_LEVEL || 'INFO';

function log(level, message, ...args) {
  if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, ...args);
  }
}

function debug(message, ...args) {
  log('DEBUG', message, ...args);
}

function info(message, ...args) {
  log('INFO', message, ...args);
}

function warn(message, ...args) {
  log('WARN', message, ...args);
}

function error(message, ...args) {
  log('ERROR', message, ...args);
}

module.exports = {
  debug,
  info,
  warn,
  error
};