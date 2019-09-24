module.exports = {
  "verbose": true,
  "roots": [
    "test"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "json",
    "text",
    "lcov",
    "clover"
  ],
  collectCoverage: true,
}