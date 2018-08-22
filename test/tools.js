const assert = require("assert")
const tools = require("../lib/tools")

describe("Tools", () => {

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
      self: null
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
  })

  it("isConcept, isScheme", () => {
    let concept = {
      type: ["http://www.w3.org/2004/02/skos/core#Concept"]
    }
    let scheme = {
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
    }
    let other = {
      type: ["something else"]
    }
    assert.ok(tools.isConcept(concept))
    assert.ok(!tools.isScheme(concept))
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
      test: "hello world"
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
    // Check if test properties remain in original object
    assert.ok(mapping.from.memberSet[0].test)
    assert.ok(mapping.to.memberChoice[0].test)
    assert.ok(mapping.fromScheme.test)
    assert.ok(mapping.toScheme.test)
    assert.ok(mapping.test)
    // Check if null value gets converted to empty object
    let emptyNewMapping = tools.minifyMapping({})
    assert.equal(Object.keys(emptyNewMapping).length, 0, "minifyMapping added properties to empty mapping")
  })

})
