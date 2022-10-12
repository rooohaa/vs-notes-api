declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_CLIENT_SECRET: string;
      GITHUB_CLIENT_ID: string;
      APP_SECRET_KEY: string;
    }
  }
}

export {}
