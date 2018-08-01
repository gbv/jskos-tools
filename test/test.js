const assert = require("assert")
const ajv = new require("ajv")()

const resourceSchema = require("../schemas/resource.schema.json")
const itemSchema = require("../schemas/item.schema.json")
const conceptSchema = require("../schemas/concept.schema.json")

// Import example concepts
let concepts = []
concepts.push({
  concept: require("../examples/concepts/example.concept.fail.1.json"),
  expected: false
})
const remoteExamplesBasePath = "../examples/jskos/examples/"
concepts.push({
  concept: require(remoteExamplesBasePath + "ddc-612.112.concept.json"),
  expected: true
})
concepts.push({
  concept: require(remoteExamplesBasePath + "ddc-641.5.concept.json"),
  expected: true
})
concepts.push({
  concept: require(remoteExamplesBasePath + "example.concept.json"),
  expected: true
})
concepts.push({
  concept: require(remoteExamplesBasePath + "gnd-4130604-1.concept.json"),
  expected: true
})
concepts.push({
  concept: require(remoteExamplesBasePath + "gnd-7507432-1.concept.json"),
  expected: true
})

describe("JSKOS JSON Schemas", function() {

  var validateConcept

  // Add schemas to validator
  it("should be added to validator without errors", function() {
    assert.doesNotThrow(function() {
      ajv.addSchema(resourceSchema)
      ajv.addSchema(itemSchema)
      ajv.addSchema(conceptSchema)
    })
  })

  // Compile schemas into validators
  it("should compile without errors", function() {
    assert.doesNotThrow(function() {
      validateConcept = ajv.compile(conceptSchema)
    })
  })

  // Validate concepts
  it("should validate concepts (" + concepts.length + ")", function() {
    for (let { concept, expected } of concepts) {
      let result = validateConcept(concept)
      let errorText =
        !result
          ? `Concept ${concept.uri} did not validate:
          ${validateConcept.errors.reduce((t, c) => t + "-" + c.message + "\n", "")}`
          : (expected ? "" : `Concept ${concept.uri} passed even though it should.`)
      assert.equal(result, expected, errorText)
    }
  })

})

