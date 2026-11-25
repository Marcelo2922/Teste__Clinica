/** Jest do back-end (api_clinica): TypeScript via Babel, sem depender da versão do tsc. */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: { "^.+\\.tsx?$": "babel-jest" },
  collectCoverageFrom: ["src/estoque/**/*.ts", "!**/*.test.ts", "!src/estoque/estoqueRepo.ts"],
  coverageThreshold: { global: { lines: 80, functions: 80, branches: 80 } },
};
