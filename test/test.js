const glob = require("glob")
const fs = require("fs")

const assert = require("assert")
const ajv = new require("ajv")({ extendRefs: true })

let schemas = {
  resource: require("../schemas/resource.schema.json"),
  item: require("../schemas/item.schema.json"),
  concept: require("../schemas/concept.schema.json"),
  scheme: require("../schemas/scheme.schema.json"),
  mapping: require("../schemas/mapping.schema.json"),
  occurrence: require("../schemas/occurrence.schema.json")
}

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
      expected: true,
      file
    })
  } catch(error) {
    console.log("Unable to parse file", file)
  }
}

describe("JSKOS JSON Schemas", () => {

  let validate = {}

  // Add schemas to validator
  before("should be added to validator without errors", () => {
    assert.doesNotThrow(() => {
      ajv.addSchema(schemas.resource)
      ajv.addSchema(schemas.item)
      for (let type of types) {
        validate[type] = ajv.compile(schemas[type])
      }
    })
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
                ? `${type} ${object.uri} did not validate:
                ${validate[type].errors.reduce((t, c) => `${t}-${c.message}\n`, "")}`
                : (expected ? "" : `${type} ${object.uri} passed even though it shouldn't.`)
            assert.equal(result, expected, errorText)
          }
        })
      }
    })
  }

})
