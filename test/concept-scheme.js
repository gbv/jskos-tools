const assert = require("assert")

const { ConceptScheme } = require("../index.js")
const gnd = require("./gnd.scheme.json")

describe("ConceptConceptScheme", () => {
  let scheme = new ConceptScheme(gnd)
  let uri = "http://d-nb.info/gnd/4021477-1"
  let notation = "4021477-1"
  let { uriPattern } = scheme

  it("has copied some fields", () => {
    assert.deepEqual(scheme.notation, ["GND"])
  })

  it("maps notation <=> uri", () => {
    assert.equal(notation, scheme.notationFromUri(uri))
    assert.equal(uri, scheme.uriFromNotation(notation))
    assert.equal("http://d-nb.info/gnd/%20", scheme.uriFromNotation(" "))
    assert.equal(null, scheme.notationFromUri("x:y"))
  })

  it("conceptFromUri", () => {
    assert.deepEqual({uri, notation: [notation]}, scheme.conceptFromUri(uri))
    assert.equal(null, scheme.conceptFromUri("x:y"))
  })

  it("isValidNotation", () => {
    assert.ok(scheme.isValidNotation(notation))
    assert.ok(!scheme.isValidNotation("x"))
  })

  it("builds uriPattern", () => {
    delete scheme.uriPattern
    scheme = new ConceptScheme(scheme)
    assert.equal(uriPattern, scheme.uriPattern)
  })
})
