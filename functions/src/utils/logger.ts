import * as logger from 'firebase-functions/logger';

export const Logger = {
  info: (message: string, ...args: any[]) => {
    logger.info(`[AlertaGame Sync] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    logger.warn(`[AlertaGame Sync] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    logger.error(`[AlertaGame Sync] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    logger.debug(`[AlertaGame Sync] ${message}`, ...args);
  }
};
