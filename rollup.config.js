const pkg = require("./package.json")
const commonjs = require("@rollup/plugin-commonjs")
const resolve = require("@rollup/plugin-node-resolve")
const babel = require("@rollup/plugin-babel")
const json = require("@rollup/plugin-json")
const license = require("rollup-plugin-license")

module.exports = [
  {
    input: "index.js",
    output: {
      name: "jskos",
      file: pkg.jsdelivr,
      format: "umd",
    },
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
      // Add a plugin that assembles licenses for dependencies
      license({
        banner: {
          commentStyle: "ignored",
          content: `${pkg.name} v${pkg.version}\nCopyright (c) 2018 Verbundzentrale des GBV (VZG)\n@license ${pkg.license}\n\nFor dependency license information, please see ${pkg.jsdelivr}.LICENSES.txt.`,
        },
        thirdParty: {
          output: {
            file: pkg.jsdelivr + ".LICENSES.txt",
          },
        },
      }),
      babel({
        babelHelpers: "bundled",
      }),
    ],
    strictDeprecations: true,
  },
]
