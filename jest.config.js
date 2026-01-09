export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverageFrom: [
    "controllers/**/*.ts",
    "services/**/*.ts",
    "models/**/*.ts",
    "!**/node_modules/**",
    "!**/dist/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Important: This tells Jest to use ts-jest, not Babel
  transformIgnorePatterns: ["node_modules/(?!(@babel|.*\\.mjs$))"],
  // Increase timeout for database operations
  testTimeout: 60000, // 60 seconds
};
