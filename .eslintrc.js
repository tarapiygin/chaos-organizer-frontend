const standardRestrictedGlobals = require('eslint-restricted-globals');
const noRestrictedGlobals = ["error", "isNaN", "isFinite"].concat(
  standardRestrictedGlobals
);
const noRestrictedGlobalsWorker = noRestrictedGlobals.filter(o => o !== 'self');
module.exports = {
  "extends": "airbnb-base",
  "env": {
    "es6": true,
    "browser": true,
    "jest": true,
    "worker": true,
    "serviceworker": true
  },
  "rules": {
    "no-restricted-globals": noRestrictedGlobals,
    "no-restricted-syntax": [
      "error",
      "LabeledStatement",
      "WithStatement"
    ]
  },
  "overrides": [
    {
      "files": ["*.worker.js"],
      "rules": {
        "no-restricted-globals": noRestrictedGlobalsWorker
      }
    }
  ]
}
