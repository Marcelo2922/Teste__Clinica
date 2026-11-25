/** Jest do front-end (clinica-frontend): jsdom + Babel (TS/JSX) + Testing Library. */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: { "\\.(css|svg|png|jpg)$": "<rootDir>/__mocks__/fileMock.cjs" },
  collectCoverageFrom: [
    "src/components/estoque/**/*.{ts,tsx}",
    "src/pages/Estoque/**/*.tsx",
    "!**/*.test.*",
  ],
  coverageThreshold: { global: { lines: 80, functions: 80, branches: 70 } },
};
