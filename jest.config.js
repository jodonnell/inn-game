export default {
  testMatch: ["**/test/**/*.js"],
  transform: {},
  moduleNameMapper: {
    "^.+\\?url$": "<rootDir>/config/jest/url-stub.js",
    "\\.(png|jpg|jpeg|gif|svg)$": "<rootDir>/config/jest/url-stub.js",
    "^@/(.*)$": "<rootDir>/$1",
  },
}
