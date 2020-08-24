import pkg from "./package.json"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import json from "@rollup/plugin-json"

export default [
  {
    input: "index.js",
    output: {
      name: "jskos",
      file: pkg.browser,
      format: "umd",
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      babel({
        babelHelpers: "bundled",
      }),
    ],
  },
]
