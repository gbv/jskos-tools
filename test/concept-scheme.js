const assert = require("assert")

const { ConceptScheme } = require("../index.js")

describe("ConceptScheme", () => {
  const gnd = require("./gnd.scheme.json")
  const uri = "http://d-nb.info/gnd/4021477-1"
  const notation = "4021477-1"
  const scheme = new ConceptScheme(gnd)

  it("constructor", () => {
    assert.deepEqual(scheme.notation, ["GND"])

    assert.equal(scheme.uriPattern, "^http://d-nb\\.info/gnd/([0-9X-]+)$")

    let small = new ConceptScheme({ namespace: scheme.namespace })
    assert.equal(small.uriPattern, "^http://d-nb\\.info/gnd/(.+)$")
  })

  it("isValidNotation", () => {
    assert.ok(scheme.isValidNotation(notation))
    assert.ok(!scheme.isValidNotation(undefined))
    assert.ok(!scheme.isValidNotation("x"))
    // Remove notation pattern from GND and confirm that function call still succeeds
    const schemeWithoutPattern = new ConceptScheme(Object.assign({}, gnd, { notationPattern: null }))
    assert.ok(schemeWithoutPattern.isValidNotation("x"))
  })

  it("maps notation <=> uri", () => {
    assert.equal(notation, scheme.notationFromUri(uri))
    assert.equal(uri, scheme.uriFromNotation(notation))
    assert.equal("http://d-nb.info/gnd/%20", scheme.uriFromNotation(" "))
    assert.equal(null, scheme.notationFromUri("x:y"))
  })

  it("conceptFromUri", () => {
    let expect = {uri, notation: [notation]}
    assert.deepEqual(expect, scheme.conceptFromUri(uri))
    assert.equal(null, scheme.conceptFromUri("x:y"))

    expect.inScheme = [{uri: scheme.uri}]
    assert.deepEqual(expect, scheme.conceptFromUri(uri, { inScheme: true }))
  })

  it("conceptFromNotation", () => {
    let expect = {uri, notation: [notation]}
    let concept = scheme.conceptFromNotation(notation)
    assert.deepEqual(expect, concept )

    expect.topConceptOf = [{uri: scheme.uri}]
    concept = scheme.conceptFromNotation(notation, { topConcept: true })
    assert.deepEqual(expect, concept )
  })

})

describe("ConceptScheme with spaces in notation", () => {
  const scheme = new ConceptScheme({
    namespace: "http://example.org/",
    notationPattern: "[A-Z]( [A-Z])*"
  })
  const notation = "A B"
  const uri = "http://example.org/A%20B"

  it("isValidNotation", () => {
    assert.ok(scheme.isValidNotation(notation))
  })

  it("uriFromNotation", () => {
    assert.equal(uri, scheme.uriFromNotation(notation))
  })

  it("notationFromUri", () => {
    assert.equal(notation, scheme.notationFromUri(uri))
  })

  it("conceptFromUri", () => {
    assert.deepEqual({uri, notation: [notation]}, scheme.conceptFromUri(uri))
  })

  it("conceptFromNotation", () => {
    let concept = scheme.conceptFromNotation(notation)
    assert.deepEqual({uri, notation: [notation]}, concept )
  })

})
