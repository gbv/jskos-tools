import assert from "assert"
import fs from "fs"
import * as jskos from "../src/index.js"
import _ from "lodash"

let readme = fs.readFileSync("./README.md", "utf8")

describe("Documentation", () => {

  describe("should contain documentation for each property of module", () => {
    _.forOwn(jskos, (value, key) => {
      if (key === "default") {
        return
      }
      it(key, () => {
        assert.ok(readme.includes(`### ${key}\n`) || readme.includes(`\`${key}\``), `No documentation for property ${key}.`)
      })
    })
  })

  // TODO: - Check for standard-readme compliance.
})
