const assert = require("assert")
const fs = require("fs")
const jskos = require("../index")
const _ = {
  forOwn: require("lodash/forOwn"),
}

let readme = fs.readFileSync("./README.md", "utf8")

describe("Documentation", () => {

  describe("should contain documentation for each property of module", () => {
    _.forOwn(jskos, (value, key) => {
      it(key, () => {
        assert.ok(readme.includes(`### ${key}\n`) || readme.includes(`\`${key}\``), `No documentation for property ${key}.`)
      })
    })
  })

  // TODO: - Check for standard-readme compliance.
})
