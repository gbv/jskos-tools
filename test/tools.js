const assert = require("assert")
const tools = require("../lib/tools")

describe("Tools", () => {
  it("addContext", () => {
    let object = { }
    assert.equal(tools.addContext(object), object)
    assert.equal(object["@context"], "https://gbv.github.io/jskos/context.json")
    let array = tools.addContext([{}])
    assert.equal(array[0]["@context"], "https://gbv.github.io/jskos/context.json")
  })

  it("clean", () => {
    let object = {
      uri: "http://example.com/test",
      _id: "some_database_identifier"
    }
    assert.ok(object._id)
    tools.clean(object)
    assert.ok(!object._id)
  })

  it("copyDeep", () => {
    let object = {
      uri: "http://example.com/test",
      self: null,
      _test: 3,
    }
    let copy
    // Artifically creating a circular structur
    object.self = [object]
    // First, create a shallow copy
    copy = object
    copy.uri = "http://example.com/test2"
    assert.equal(object.uri, copy.uri)
    // Test the actual deep copy
    copy = tools.copyDeep(object, ["self"])
    assert.ok(copy.self && copy.self.length == 1 && copy.self[0] == null)
    assert.equal(object.uri, copy.uri)
    copy.uri = "http://example.com/test3"
    assert.notEqual(object.uri, copy.uri)
    // All properties starting with an underscore should be ignored
    assert.equal(copy._test, undefined)
  })

  it("getAllUris", () => {
    let object = {
      uri: "http://example.com/test",
      identifier: [
        "http://alternative.com/test"
      ]
    }
    let uris = tools.getAllUris(object)
    assert.deepEqual(uris, [
      "http://example.com/test",
      "http://alternative.com/test",
      "https://example.com/test",
      "https://alternative.com/test",
      "http://example.com/test/",
      "http://alternative.com/test/",
      "https://example.com/test/",
      "https://alternative.com/test/",
      "http://example.com/test",
      "http://alternative.com/test",
      "https://example.com/test",
      "https://alternative.com/test",
      "http://example.com/test/",
      "http://alternative.com/test/",
      "https://example.com/test/",
      "https://alternative.com/test/"
    ])
  })

  it("compare", () => {
    let object1 = {
      uri: "http://example.com/test"
    }
    let object2 = {
      uri: "http://alternative.com/test",
      identifier: [
        "http://example.com/test"
      ]
    }
    let object3 = {
      uri: "http://example.com/test2"
    }
    assert.ok(tools.compare(object1, object2))
    assert.ok(!tools.compare(object1, object3))
    assert.ok(!tools.compare(object1, null))
    assert.ok(!tools.compare(null, object3))
    assert.ok(tools.compare(null, null))
  })

  it("isConcept, isScheme", () => {
    let concepts = [
      {
        type: ["http://www.w3.org/2004/02/skos/core#Concept"]
      },
      {
        inScheme: { uri: "test" }
      },
      {
        topConceptOf: [{ uri: "test" }]
      }
    ]
    let scheme = {
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
    }
    let other = {
      type: ["something else"]
    }
    for (let concept of concepts) {
      assert.ok(tools.isConcept(concept))
      assert.ok(!tools.isScheme(concept))
    }
    assert.ok(!tools.isConcept(scheme))
    assert.ok(tools.isScheme(scheme))
    assert.ok(!tools.isConcept(other))
    assert.ok(!tools.isScheme(other))
  })

  it("isContainedIn", () => {
    let objects = [
      { uri: "test1" },
      { uri: "test2" },
      { uri: "test3" }
    ]
    let object1 = { uri: "test1" }
    let object2 = { identifier: ["test2"] }
    let object3 = { uri: "test4" }
    assert.ok(tools.isContainedIn(object1, objects))
    assert.ok(tools.isContainedIn(object2, objects))
    assert.ok(!tools.isContainedIn(object3, objects))
  })

  it("sortConcepts, sortSchemes", () => {
    let objects = [
      {
        uri: "1",
        notation: ["TEST1"],
        prefLabel: {
          de: "Erster Test"
        }
      },
      {
        uri: "3",
        notation: ["TEST3"],
        prefLabel: {
          de: "Dritter Test"
        }
      },
      {
        uri: "2",
        notation: ["TEST2"],
        prefLabel: {
          de: "Zweiter Test"
        }
      }
    ]
    let sortedConcepts = tools.sortConcepts(objects)
    assert.ok(sortedConcepts[0].uri == "1")
    assert.ok(sortedConcepts[1].uri == "2")
    assert.ok(sortedConcepts[2].uri == "3")
    let sortedSchemes = tools.sortSchemes(objects)
    assert.ok(sortedSchemes[0].uri == "3")
    assert.ok(sortedSchemes[1].uri == "1")
    assert.ok(sortedSchemes[2].uri == "2")
  })

  it("minifyMapping", () => {
    let mapping = {
      from: {
        memberSet: [
          {
            uri: "test",
            test: "hello world"
          }
        ]
      },
      to: {
        memberChoice: [
          {
            notation: ["TEST2"],
            test: "hello world"
          }
        ]
      },
      fromScheme: {
        test: "hello world"
      },
      toScheme: {
        test: "hello world"
      },
      type: ["test"],
      test: "hello world",
      created: "123",
      modified: "456",
      note: {
        de: ["test"]
      },
      identifier: ["hallo"]
    }
    let newMapping = tools.minifyMapping(mapping)
    // Check if test properties got removed
    assert.ok(!newMapping.test)
    assert.ok(!newMapping.from.memberSet[0].test)
    assert.ok(!newMapping.to.memberChoice[0].test)
    assert.ok(!newMapping.fromScheme.test)
    assert.ok(!newMapping.toScheme.test)
    // Check if important properties remained
    assert.ok(newMapping.type && newMapping.type.length)
    assert.equal(newMapping.from.memberSet[0].uri, mapping.from.memberSet[0].uri)
    assert.equal(newMapping.to.memberChoice[0].uri, mapping.to.memberChoice[0].uri)
    assert.ok(newMapping.created)
    assert.ok(newMapping.modified)
    assert.equal(newMapping.note.de[0], mapping.note.de[0])
    assert.equal(newMapping.identifier[0], mapping.identifier[0])
    // Check if test properties remain in original object
    assert.ok(mapping.from.memberSet[0].test)
    assert.ok(mapping.to.memberChoice[0].test)
    assert.ok(mapping.fromScheme.test)
    assert.ok(mapping.toScheme.test)
    assert.ok(mapping.test)
    assert.ok(mapping.created)
    assert.ok(mapping.modified)
    assert.ok(mapping.note)
    // Check if null value gets converted to empty object
    let emptyNewMapping = tools.minifyMapping({})
    assert.equal(Object.keys(emptyNewMapping).length, 0, "minifyMapping added properties to empty mapping")
  })

  it("mappingToCSV", () => {
    let mapping = {
      from: { memberSet: [{ notation: ["0"], prefLabel: { en: "'" }}] },
      to: { memberSet: [{ notation: ["a'c"], prefLabel: { en: "0" } }] },
      type: ["http://www.w3.org/2004/02/skos/core#broadMatch"]
    }
    let csv = (options) => tools.mappingToCSV(options)(mapping)

    assert.equal(csv(), "\"0\",\"a'c\",\"broad\"\n")

    mapping.type = []
    assert.equal(csv({delimiter:";", quoteChar:"'"}), "'0';'a''c';''\n")
    assert.equal(csv({language:"en", quoteChar:"'"}), "'0','''','a''c','0',''\n")
    assert.equal(csv({language:"xx", quoteChar:"'"}), "'0','','a''c','',''\n")
  })

  it("conceptsOfMapping", () => {
    let mappings = [
      {
        from: { memberSet: [{ uri: "http://test1" }] },
        to: { memberSet: [{ uri: "http://test2" }, { uri: "http://test3" }] },
        fromResult: 1,
        toResult: 2,
      },
      {
        from: { memberSet: [{ uri: "http://test1" }] },
        to: { memberList: [{ uri: "http://test2" }, { uri: "http://test3" }, { uri: "http://test4" }] },
        fromResult: 1,
        toResult: 3,
      },
      {
        from: { memberSet: [{ uri: "http://test1" }] },
        to: { memberChoice: [{ uri: "http://test2" }, { uri: "http://test3" }, { uri: "http://test3" }, { uri: "http://test4" }] },
        fromResult: 1,
        toResult: 4,
      },
    ]
    for (let mapping of mappings) {
      // Test sides
      for (let side of ["from", "to"]) {
        assert.equal(tools.conceptsOfMapping(mapping, side).length, mapping[`${side}Result`])
      }
      // Test total
      assert.equal(tools.conceptsOfMapping(mapping).length, mapping["fromResult"]+mapping["toResult"])
    }
  })

})
