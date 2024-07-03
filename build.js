import esbuild from "esbuild"
import { globSync as glob } from "glob"
import fs from "fs"
const readFile = fs.promises.readFile

;(async () => {
  const pkg = JSON.parse(
    await readFile("./package.json"),
  )
  
  const sourceFolder = process.env.BUILD_SOURCE_FOLDER || "./src"
  const targetFolder = process.env.BUILD_TARGET_FOLDER || "./dist"

  // Node ESM build
  await esbuild.build({
    entryPoints: glob(`${sourceFolder}/**/*.js`),
    platform: "node",
    format: "esm",
    outdir: `${targetFolder}/esm`,
  })

  // Node CJS build
  await esbuild.build({
    entryPoints: [`${sourceFolder}/index.js`],
    platform: "node",
    format: "cjs",
    outdir: `${targetFolder}/cjs`,
    outExtension: {
      ".js": ".cjs",
    },
    bundle: true,
  })

  // Browser
  const browserTargetFile = `${targetFolder}/${pkg.name}.js`
  let licenseFile = "./LICENSE"

  // Copyright for banner
  const bannerCopyright = fs.readFileSync(licenseFile, "utf-8").split("\n").find(l => l.startsWith("Copyright"))

  // Browser build
  await esbuild.build({
    entryPoints: [`${sourceFolder}/index.js`],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: "es2015",
    format: "iife",
    globalName: "jskos",
    outfile: browserTargetFile,
    banner: {
      js: `/*!
  * ${pkg.name} v${pkg.version}
  * ${bannerCopyright}
  * @license ${pkg.license}
  */`,
    },
  })

})()
