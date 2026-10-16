/** Debug logging that only prints in development builds. */
export const logger = {
  debug: (...args: unknown[]): void => {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
};
