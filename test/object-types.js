import assert from "assert"
import { objectTypes, guessObjectType, usedObjectTypes } from "../src/object-types.js"
describe("Object Types", () => {
  it("objectTypes", () => {
    assert.ok("ConceptScheme" in objectTypes)
  })

  it("guessObjectType (shortname)", () => {
    for (let name in objectTypes) {
      let shortName = name.toLowerCase().replace(/^concept(.+)/, "$1")
      assert.equal(guessObjectType(name, true), shortName)

      let plural = shortName[-1] === "y"
        ? shortName.slice(0,-1) + "ies" : shortName + "s"
      assert.equal(guessObjectType(plural, true), shortName)
    }
  })

  it("guessObjectType (string)", () => {
    for (let name in objectTypes) {
      assert.equal(guessObjectType(name), name)
      assert.equal(guessObjectType(name.toLowerCase()), name)
    }
    assert.equal(guessObjectType("scheme"), "ConceptScheme")
    assert.equal(guessObjectType("occurrences"), "ConceptOccurrence")
    assert.equal(guessObjectType("annotations"), "Annotation")
    assert.equal(guessObjectType("http://www.w3.org/ns/oa#Annotation"), "Annotation")
    assert.equal(guessObjectType("http://purl.org/cld/cdtype/CatalogueOrIndex"), "Registry")
    assert.ok(!guessObjectType(""))
    assert.ok(!guessObjectType("?"))
  })

  it("guessObjectType (object)", () => {
    for (let name in objectTypes) {
      const { type } = objectTypes[name]
      for (let uri of (type || [])) {
        let obj = { type: name === "Annotation" ? uri : [uri] }
        assert.equal(guessObjectType(obj), name)
      }
    }
  })

  it("guessObjectType (undefined)", () => {
    assert.equal(guessObjectType("XXXX", true), undefined)
  })

  it("usedObjectTypes", () => {
    [
      [{}, []],
      [{properties:[]}, []],
      [{properties:[null]}, []],
      [{properties:[{}]}, ["http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"]],
      [ 
        {concepts:[], mappings:[{},null], annotations:[{},{}]},
        ["http://www.w3.org/2004/02/skos/core#mappingRelation","http://www.w3.org/ns/oa#Annotation"],
      ],
      [
        {concepts:[{}],schemes:[{}]},
        ["http://www.w3.org/2004/02/skos/core#Concept","http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      ],
    ]
      .forEach(([obj, expect]) => assert.deepEqual(usedObjectTypes(obj), expect))
  })
})
