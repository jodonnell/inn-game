export default {
  testMatch: ["**/test/**/*.js"],
  transform: {},
  moduleNameMapper: {
    "^.+\\?url$": "<rootDir>/config/jest/url-stub.js",
    "\\.(png|jpg|jpeg|gif|svg|mp3|ogg|wav)$": "<rootDir>/config/jest/url-stub.js",
    "^@/(.*)$": "<rootDir>/$1",
  },
}
