const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.logLevel = this.getLogLevel();
    this.logFile = process.env.LOG_FILE || './logs/app.log';
    this.ensureLogDirectory();
  }

  getLogLevel() {
    const level = (process.env.LOG_LEVEL || 'info').toUpperCase();
    return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  writeToFile(formattedMessage) {
    if (process.env.NODE_ENV !== 'test') {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    }
  }

  log(level, levelNum, message, meta = {}) {
    if (levelNum <= this.logLevel) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      // Console output with colors
      if (process.env.NODE_ENV !== 'production') {
        const colors = {
          ERROR: '\x1b[31m', // Red
          WARN: '\x1b[33m',  // Yellow
          INFO: '\x1b[36m',  // Cyan
          DEBUG: '\x1b[90m'  // Gray
        };
        console.log(`${colors[level]}${formattedMessage}\x1b[0m`);
      }
      
      // File output
      this.writeToFile(formattedMessage);
    }
  }

  error(message, meta = {}) {
    this.log('ERROR', LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', LOG_LEVELS.DEBUG, message, meta);
  }

  // Socket.IO specific logging
  socket(message, meta = {}) {
    this.debug(`[SOCKET] ${message}`, meta);
  }

  // Database specific logging
  db(message, meta = {}) {
    this.debug(`[DB] ${message}`, meta);
  }

  // Authentication specific logging
  auth(message, meta = {}) {
    this.info(`[AUTH] ${message}`, meta);
  }

  // API specific logging
  api(message, meta = {}) {
    this.debug(`[API] ${message}`, meta);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;