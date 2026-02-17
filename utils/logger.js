const Constants = require('../config/constants');

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.level = Constants.LOGGING.DEFAULT_LEVEL;
  }

  setLevel(level) {
    if (!Constants.LOGGING.LEVELS[level]) {
      console.warn(`Invalid log level: ${level}`);
      return;
    }
    this.level = level;
  }

  error(message, error = null) {
    this._log(Constants.LOGGING.LEVELS.ERROR, message, error);
  }

  warn(message, data = null) {
    this._log(Constants.LOGGING.LEVELS.WARN, message, data);
  }

  info(message, data = null) {
    this._log(Constants.LOGGING.LEVELS.INFO, message, data);
  }

  debug(message, data = null) {
    this._log(Constants.LOGGING.LEVELS.DEBUG, message, data);
  }

  _log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

module.exports = Logger;
