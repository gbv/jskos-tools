const pkg = require("./package.json")
const commonjs = require("@rollup/plugin-commonjs")
const resolve = require("@rollup/plugin-node-resolve")
const license = require("rollup-plugin-license")

const licenseOptions = {
  banner: {
    commentStyle: "ignored",
    content: `${pkg.name} v${pkg.version}\nCopyright (c) 2024 Verbundzentrale des GBV (VZG)\n@license ${pkg.license}`,
  },
}

module.exports = [
  {
    input: "index.js",
    output: {
      name: "jskos",
      file: pkg.exports.require,
      format: "umd",
      exports: "named",
    },
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      license(licenseOptions),
    ],
    strictDeprecations: true,
  },
  {
    input: "index.js",
    output: {
      name: "jskos",
      file: pkg.exports.import,
      format: "es",
    },
    plugins: [
      resolve({
        browser: true,
      }),
      license(licenseOptions),
    ],
  },
]
