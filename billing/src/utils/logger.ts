export const createLogger = (name: string) => {
  return {
    info: (message: string, meta?: any) => {
      console.log(`[${name}] INFO: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, meta?: any) => {
      console.error(`[${name}] ERROR: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    warn: (message: string, meta?: any) => {
      console.warn(`[${name}] WARN: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    debug: (message: string, meta?: any) => {
      console.debug(`[${name}] DEBUG: ${message}`, meta ? JSON.stringify(meta) : '');
    }
  };
};
