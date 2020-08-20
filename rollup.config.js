import pkg from "./package.json"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import terser from "@yuloh/rollup-plugin-terser"

export default [
  // browser-friendly UMD build
  {
    input: "index.js",
    output: {
      name: "jskos",
      file: pkg.browser,
      format: "umd",
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel(),
      terser(),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: "index.js",
    external: ["lodash"],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
    plugins: [
      commonjs(),
      terser(),
    ],
  },
]
