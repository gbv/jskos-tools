import gbv from "eslint-config-gbv"

export default [
  ...gbv,
  {
    ignores: [
      "jsdoc",
      "src/mapping-types.js",
      "src/sha1.js",
    ],
  },
]
