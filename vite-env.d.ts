// The reference to vite/client is removed to fix the type definition error.
// We augment NodeJS.ProcessEnv to support the usage in the codebase without redeclaring process.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
