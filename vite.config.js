import { defineConfig } from "vite"
import { readFileSync } from "fs"
import { resolve } from "path"

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"))
const license = readFileSync("./LICENSE", "utf-8")
const bannerCopyright = license.split("\n").find(l => l.startsWith("Copyright"))

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * ${bannerCopyright}
  * @license ${pkg.license}
  */`

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "jskos",
      fileName: (format) => {
        if (format === "es") {
          return `${pkg.name}.js`
        }
        if (format === "cjs") {
          return `${pkg.name}.cjs`
        }
        if (format === "umd") {
          return `${pkg.name}.umd.cjs`
        }
        return `${pkg.name}.${format}.js`
      },
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      output: {
        banner,
        exports: "named",
      },
    },
    sourcemap: true,
    target: "es2015",
    minify: true,
  },
})
