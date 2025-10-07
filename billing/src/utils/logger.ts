export const createLogger = (name: string) => {
  return {
    info: (message: string, meta?: any) => {
      console.log([] INFO: , meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, meta?: any) => {
      console.error([] ERROR: , meta ? JSON.stringify(meta) : '');
    },
    warn: (message: string, meta?: any) => {
      console.warn([] WARN: , meta ? JSON.stringify(meta) : '');
    },
    debug: (message: string, meta?: any) => {
      console.debug([] DEBUG: , meta ? JSON.stringify(meta) : '');
    }
  };
};
