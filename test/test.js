const glob = require("glob")
const fs = require("fs")

const assert = require("assert")
const ajv = new require("ajv")({ extendRefs: true })

const resourceSchema = require("../schemas/resource.schema.json")
const itemSchema = require("../schemas/item.schema.json")
const conceptSchema = require("../schemas/concept.schema.json")

let examples = {
  concept: [],
  scheme: [],
  mapping: [],
  occurrence: []
}
let types = Object.keys(examples)
// Import local example objects
for (let type of types) {
  for (let expected of [true, false]) {
    let files = glob.sync(`examples/${type}/${expected ? "pass" : "fail"}/*.json`)
    for (let file of files) {
      try {
        let object = JSON.parse(fs.readFileSync(file))
        examples[type].push({
          object,
          expected
        })
      } catch(error) {
        console.log("Unable to parse file", file)
      }
    }
  }
}
// Import remote example objects
let files = glob.sync("examples/jskos/examples/*.json")
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
      expected: true
    })
  } catch(error) {
    console.log("Unable to parse file", file)
  }
}

describe("JSKOS JSON Schemas", () => {

  let validateConcept

  // Add schemas to validator
  before("should be added to validator without errors", () => {
    assert.doesNotThrow(() => {
      ajv.addSchema(resourceSchema)
      ajv.addSchema(itemSchema)
      ajv.addSchema(conceptSchema)
      validateConcept = ajv.compile(conceptSchema)
    })
  })

  // Validate concepts
  describe("Concepts", () => {
    it("should validate concepts (" + examples.concept.length + ")", () => {
      for (let { object: concept, expected } of examples.concept) {
        let result = validateConcept(concept)
        let errorText =
          !result
            ? `Concept ${concept.uri} did not validate:
            ${validateConcept.errors.reduce((t, c) => `${t}-${c.message}\n`, "")}`
            : (expected ? "" : `Concept ${concept.uri} passed even though it shouldn't.`)
        assert.equal(result, expected, errorText)
      }
    })
  })

})

