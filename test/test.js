const glob = require("glob")
const fs = require("fs")

const assert = require("assert")
const { validate } = require("../index")

let types = ["resource", "item", "concept", "scheme", "mapping", "concordance", "registry", "distribution", "occurrence", "conceptBundle"]
let examples = {}

// Import local example objects
for (let type of types) {
  examples[type] = []
  for (let expected of [true, false]) {
    let files = glob.sync(`examples/${type}/${expected ? "pass" : "fail"}/*.json`)
    for (let file of files) {
      try {
        let object = JSON.parse(fs.readFileSync(file))
        examples[type].push({
          object,
          expected,
          file
        })
      } catch(error) {
        console.log("Unable to parse file", file)
      }
    }
  }
}
// Import remote example objects
let files = glob.sync("jskos/examples/*.json")
for (let file of files) {
  let type = null
  for (let possibleType of types) {
    if (file.indexOf(possibleType) != -1) {
      type = possibleType
      break
    }
  }
  if (!type) {
    continue
  }
  try {
    let object = JSON.parse(fs.readFileSync(file))
    examples[type].push({
      object,
      expected: true,
      file
    })
  } catch(error) {
    console.log("Unable to parse file", file)
  }
}

describe("JSKOS JSON Schemas", () => {

  // Check if all validators exist
  describe("validators", () => {
    for (let type of types) {
      it(`should exist for ${type}`, () => {
        assert.equal(validate[type] != null, true, `validator for ${type} does not exist`)
      })
    }
  })

  // Validate difference object types
  for (let type of types) {
    let typePlural = type + "s"
    describe(typePlural, () => {
      for (let { object, expected, file } of examples[type]) {
        it(`should validate ${typePlural} (${file})`, () => {
          // Support for arrays of objects
          let objects = [object]
          if (Array.isArray(object)) {
            objects = object
          }
          for (let object of objects) {
            let result = validate[type](object)
            let errorText =
              !result
                ? `${type} did not validate:
                ${validate[type].errors.reduce((t, c) => `${t}- ${c.dataPath} ${c.message}\n`, "")}`
                : (expected ? "" : `${type} passed even though it shouldn't.`)
            assert.equal(result, expected, errorText)
          }
        })
      }
    })
  }

})
