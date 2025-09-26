// Frontend logging utility

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: Record<string, any>;
  component?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = import.meta.env.VITE_LOG_LEVEL || 'info';
    return ['error', 'warn', 'info', 'debug'].includes(level) ? level as LogLevel : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>, component?: string): string {
    const timestamp = new Date().toISOString();
    const componentStr = component ? `[${component}] ` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${componentStr}${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>, component?: string): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      message,
      timestamp,
      meta,
      component
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(level, message, meta, component);
      
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
      }
    }

    // Send critical errors to error reporting service in production
    if (!this.isDevelopment && level === 'error') {
      this.reportError(logEntry);
    }
  }

  private reportError(logEntry: LogEntry): void {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or your own logging endpoint
    try {
      // Example: Send to your logging endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(() => {}); // Silently fail if logging service is down
    } catch (error) {
      // Silently fail - don't let logging errors break the app
    }
  }

  // Public logging methods
  error(message: string, meta?: Record<string, any>, component?: string): void {
    this.log('error', message, meta, component);
  }

  warn(message: string, meta?: Record<string, any>, component?: string): void {
    this.log('warn', message, meta, component);
  }

  info(message: string, meta?: Record<string, any>, component?: string): void {
    this.log('info', message, meta, component);
  }

  debug(message: string, meta?: Record<string, any>, component?: string): void {
    this.log('debug', message, meta, component);
  }

  // Specialized logging methods
  auth(message: string, meta?: Record<string, any>): void {
    this.info(`[AUTH] ${message}`, meta, 'Authentication');
  }

  api(message: string, meta?: Record<string, any>): void {
    this.debug(`[API] ${message}`, meta, 'API');
  }

  socket(message: string, meta?: Record<string, any>): void {
    this.debug(`[SOCKET] ${message}`, meta, 'Socket');
  }

  ui(message: string, meta?: Record<string, any>, component?: string): void {
    this.debug(`[UI] ${message}`, meta, component);
  }

  // Utility methods
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Group logging
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', {
      message: event.error?.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise
    });
  });
}

// Export both named and default for compatibility
export { logger };
export default logger;