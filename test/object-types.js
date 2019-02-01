const assert = require("assert")
const { objectTypes, guessObjectType } = require("../lib/object-types")

describe("Object Types", () => {
  it("objectTypes", () => {
    assert.ok("ConceptScheme" in objectTypes)    
  })

  it("guessObjectType (string)", () => {
    for (let name in objectTypes) {
      assert.equal(guessObjectType(name), name)          
      assert.equal(guessObjectType(name.toLowerCase()), name)          
    }
    assert.equal(guessObjectType("scheme"), "ConceptScheme")
    assert.equal(guessObjectType("occurrences"), "ConceptOccurrence")
    assert.ok(!guessObjectType(""))
    assert.ok(!guessObjectType("?"))
  })

  it("guessObjectType (object)", () => {
    for (let name in objectTypes) {
      const { type } = objectTypes[name]
      for (let uri of (type || [])) {
        let obj = { type: [uri] }
        assert.equal(guessObjectType(obj), name)
      }
    }
  })
})
