import pkg from "./package.json"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"

export default [
  {
    input: "index.js",
    plugins: [
      commonjs(),
      nodeResolve({browser: true}),
    ],
    output: [
      { file: pkg.module, format: "es" },
    ],
  },
]
