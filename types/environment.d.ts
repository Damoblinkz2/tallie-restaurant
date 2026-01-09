declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      PORT?: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
