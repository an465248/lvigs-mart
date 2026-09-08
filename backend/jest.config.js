/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|@aws-sdk|@opensearch-project)/)",
  ],
  collectCoverageFrom: [
    "modules/auth/**/*.ts",
    "common/guards/**/*.ts",
    "common/firebase/**/*.ts",
    "!**/*.module.ts",
    "!**/*.dto.ts",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
  },
};
