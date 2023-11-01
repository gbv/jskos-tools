const assert = require("assert")
const tools = require("../lib/tools")
const languagePreference = require("../lib/language-preference")

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
      _id: "some_database_identifier",
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
    // Test skipUnderscore
    let copy2 = tools.copyDeep(object, ["self"], false)
    assert.equal(copy2._test, object._test)
  })

  it("getAllUris", () => {
    let object = {
      uri: "http://example.com/test",
      identifier: [
        "http://alternative.com/test",
      ],
    }
    let uris = tools.getAllUris(object)
    assert.deepEqual(uris, [
      "http://example.com/test",
      "http://alternative.com/test",
    ])
  })

  it("compare", () => {
    let object1 = {
      uri: "http://example.com/test",
    }
    let object2 = {
      uri: "http://alternative.com/test",
      identifier: [
        "https://example.com/test",
      ],
    }
    let object3 = {
      uri: "http://example.com/test2",
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
        type: ["http://www.w3.org/2004/02/skos/core#Concept"],
      },
      {
        inScheme: { uri: "test" },
      },
      {
        topConceptOf: [{ uri: "test" }],
      },
    ]
    let scheme = {
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
    }
    let other = {
      type: ["something else"],
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
      { uri: "test3" },
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
        notation: ["1"],
        prefLabel: {
          de: "Erster Test",
        },
      },
      {
        uri: "0",
        notation: ["1"],
        prefLabel: {
          en: "Erster Test",
        },
      },
      {
        uri: "3",
        notation: ["3"],
        prefLabel: {
          de: "Dritter Test",
        },
      },
      {
        uri: "2",
        notation: ["2"],
        prefLabel: {
          de: "Zweiter Test",
        },
      },
      {
        uri: "11",
        notation: ["11"],
        prefLabel: {
          en: "vierter Test",
        },
      },
    ]
    let sortedConcepts = tools.sortConcepts(objects)
    assert.ok(sortedConcepts[0].uri == "0")
    assert.ok(sortedConcepts[1].uri == "1")
    assert.ok(sortedConcepts[2].uri == "11")
    assert.ok(sortedConcepts[3].uri == "2")
    assert.ok(sortedConcepts[4].uri == "3")
    // Numerical sorting
    sortedConcepts = tools.sortConcepts(objects, true)
    assert.ok(sortedConcepts[0].uri == "0")
    assert.ok(sortedConcepts[1].uri == "1")
    assert.ok(sortedConcepts[2].uri == "2")
    assert.ok(sortedConcepts[3].uri == "3")
    assert.ok(sortedConcepts[4].uri == "11")
    let sortedSchemes = tools.sortSchemes(objects)
    assert.ok(sortedSchemes[0].uri == "0")
    assert.ok(sortedSchemes[1].uri == "1")
    assert.ok(sortedSchemes[2].uri == "11")
    assert.ok(sortedSchemes[3].uri == "2")
    assert.ok(sortedSchemes[4].uri == "3")
  })

  it("minifyMapping", () => {
    let mapping = {
      from: {
        memberSet: [
          {
            uri: "test",
            test: "hello world",
          },
        ],
      },
      to: {
        memberChoice: [
          {
            notation: ["TEST2"],
            test: "hello world",
          },
        ],
      },
      fromScheme: {
        test: "hello world",
      },
      toScheme: {
        test: "hello world",
      },
      type: ["test"],
      test: "hello world",
      created: "123",
      modified: "456",
      note: {
        de: ["test"],
      },
      identifier: ["hallo"],
      partOf: [
        { uri: "test:concordance" },
      ],
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
    assert.ok(newMapping.partOf)
    assert.ok(newMapping.partOf.length)
    assert.deepEqual(newMapping.partOf[0], mapping.partOf[0])
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

  it("mappingCSV", () => {
    const mappingNormal = {
      fromScheme: { notation: ["A"] },
      from: { memberSet: [{ notation: ["0"], prefLabel: { en: "'" }}] },
      toScheme: { notation: ["B"] },
      to: { memberSet: [{ notation: ["a'c"], prefLabel: { de: "0" } }] },
      type: ["http://www.w3.org/2004/02/skos/core#broadMatch"],
    }
    const mappingCompound = {
      from: { memberSet: [{ notation: ["0"], prefLabel: { en: "'" }}] },
      to: { memberSet: [{ notation: ["a'c"], prefLabel: { en: "0" } }, { notation: ["b\" d\""], prefLabel: { en: "1 and some" } }] },
      creator: [{ prefLabel: { en: "someone" } }],
    }
    const mappings = [mappingNormal, mappingCompound]

    const options = {
      optionsNone: {},
      optionsAllColumns: {
        creator: true,
        schemes: true,
        labels: true,
      },
      optionsOther: {
        delimiter: ";",
        quoteChar: "'",
      },
    }

    const testCases = [
      {
        function: "header",
        param: mappings,
        results: {
          optionsNone: "\"fromNotation\",\"toNotation\",\"toNotation2\",\"type\"\n",
          optionsAllColumns: "\"fromScheme\",\"fromNotation\",\"fromLabel\",\"toScheme\",\"toNotation\",\"toLabel\",\"toNotation2\",\"toLabel2\",\"type\",\"creator\"\n",
          optionsOther: "'fromNotation';'toNotation';'toNotation2';'type'\n",
        },
      },
      {
        function: "header",
        params: null,
        results: {
          optionsNone: "\"fromNotation\",\"toNotation\",\"type\"\n",
          optionsAllColumns: "\"fromScheme\",\"fromNotation\",\"fromLabel\",\"toScheme\",\"toNotation\",\"toLabel\",\"type\",\"creator\"\n",
          optionsOther: "'fromNotation';'toNotation';'type'\n",
        },
      },
      {
        function: "fromMapping",
        param: mappingNormal,
        results: {
          optionsNone: "\"0\",\"a'c\",\"broad\"\n",
          optionsAllColumns: "\"A\",\"0\",\"'\",\"B\",\"a'c\",\"0\",\"broad\",\"\"\n",
          optionsOther: "'0';'a''c';'broad'\n",
        },
      },
      {
        function: "fromMapping",
        param: mappingCompound,
        results: {
          optionsNone: "\"0\",\"a'c\",\"b\"\" d\"\"\",\"\"\n",
          optionsAllColumns: "\"\",\"0\",\"'\",\"\",\"a'c\",\"0\",\"b\"\" d\"\"\",\"1 and some\",\"\",\"someone\"\n",
          optionsOther: "'0';'a''c';'b\" d\"';''\n",
        },
      },
      {
        function: "fromMappings",
        param: mappings,
        results: {
          optionsNone: "\"fromNotation\",\"toNotation\",\"toNotation2\",\"type\"\n\"0\",\"a'c\",\"\",\"broad\"\n\"0\",\"a'c\",\"b\"\" d\"\"\",\"\"\n",
          optionsAllColumns: "\"fromScheme\",\"fromNotation\",\"fromLabel\",\"toScheme\",\"toNotation\",\"toLabel\",\"toNotation2\",\"toLabel2\",\"type\",\"creator\"\n\"A\",\"0\",\"'\",\"B\",\"a'c\",\"0\",\"\",\"\",\"broad\",\"\"\n\"\",\"0\",\"'\",\"\",\"a'c\",\"0\",\"b\"\" d\"\"\",\"1 and some\",\"\",\"someone\"\n",
          optionsOther: "'fromNotation';'toNotation';'toNotation2';'type'\n'0';'a''c';'';'broad'\n'0';'a''c';'b\" d\"';''\n",
        },
      },
    ]

    for (let testCase of testCases) {
      for (let optionType of Object.keys(options)) {
        assert.equal(tools.mappingCSV(options[optionType])[testCase.function](testCase.param), testCase.results[optionType])
      }
    }

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
      // Test `null` values in memberSet (should be omitted).
      {
        from: { memberSet: [{ uri: "http://test1" }] },
        to: { memberSet: [ null ] },
        fromResult: 1,
        toResult: 0,
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

  it("compareMappingsDeep", () => {
    let mapping1 = {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.112/e23/",
            notation: [
              "612.112",
            ],
          },
        ],
      },
      to: {
        memberSet: [
          {
            uri: "http://www.wikidata.org/entity/Q42395",
            notation: [
              "Q42395",
            ],
          },
        ],
      },
      fromScheme: {
        uri: "http://dewey.info/scheme/edition/e23/",
        notation: [
          "DDC",
        ],
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/1940",
      },
      creator: [
        {
          prefLabel: {
            de: "Stefan Peters (VZG)",
          },
        },
      ],
    }
    // Same as mapping1 except without notations
    let mapping2 = {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.112/e23/",
          },
        ],
      },
      to: {
        memberSet: [
          {
            uri: "http://www.wikidata.org/entity/Q42395",
          },
        ],
      },
      fromScheme: {
        uri: "http://dewey.info/scheme/edition/e23/",
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/1940",
      },
      creator: [
        {
          prefLabel: {
            de: "Stefan Peters (VZG)",
          },
        },
      ],
    }
    // Same as mapping2 except with different creator prefLabel
    let mapping3 = {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.112/e23/",
          },
        ],
      },
      to: {
        memberSet: [
          {
            uri: "http://www.wikidata.org/entity/Q42395",
          },
        ],
      },
      fromScheme: {
        uri: "http://dewey.info/scheme/edition/e23/",
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/1940",
      },
      creator: [
        {
          prefLabel: {
            de: "Stefan Peters",
          },
        },
      ],
    }
    // Same as mapping3 except with different concept in from
    let mapping4 = {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.11/e23/",
          },
        ],
      },
      to: {
        memberSet: [
          {
            uri: "http://www.wikidata.org/entity/Q42395",
          },
        ],
      },
      fromScheme: {
        uri: "http://dewey.info/scheme/edition/e23/",
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/1940",
      },
      creator: [
        {
          prefLabel: {
            de: "Stefan Peters",
          },
        },
      ],
    }
    assert.ok(tools.compareMappingsDeep(mapping1, mapping2))
    assert.ok(!tools.compareMappingsDeep(mapping2, mapping3))
    assert.ok(!tools.compareMappingsDeep(mapping3, mapping4))
  })

  it("matchObjectTypes", () => {
    let tests = [
      {
        a: { type: ["http://www.w3.org/2004/02/skos/core#Concept"] },
        b: { type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"] },
        result: false,
      },
      {
        a: { type: ["http://www.w3.org/2004/02/skos/core#Concept"] },
        b: { type: ["http://www.w3.org/2004/02/skos/core#Concept"] },
        result: true,
      },
      {
        a: { type: [] },
        b: { type: ["http://www.w3.org/2004/02/skos/core#Concept"] },
        result: true,
      },
      {
        a: {},
        b: {},
        result: true,
      },
    ]
    for (let test of tests) {
      assert.equal(tools.matchObjectTypes(test.a, test.b), test.result)
    }
  })

  it("mergeUris", () => {
    let tests = [
      {
        a: {},
        b: {},
        result: {},
      },
      {
        a: null,
        b: {},
        result: null,
      },
      {
        a: {},
        b: null,
        result: {},
      },
      {
        a: { uri: "test1" },
        b: { uri: "test2" },
        result: { uri: "test1", identifier: ["test2"] },
      },
      {
        a: { uri: "test1" },
        b: { uri: "test2", identifier: ["test1", "test3"] },
        result: { uri: "test1", identifier: ["test3", "test2"] },
      },
      // Expect identifier property to be removed if empty
      {
        a: { uri: "test1" },
        b: { identifier: ["test1"] },
        result: { uri: "test1" },
      },
    ]
    for (let test of tests) {
      assert.deepStrictEqual(tools.mergeUris(test.a, test.b), test.result)
    }
  })

  it("merge", () => {
    let tests = [
      // Test empty objects
      {
        a: {},
        b: {},
        result: {},
      },
      // Test adding properties from b to a
      {
        a: { uri: "test" },
        b: { prefLabel: { de: "Test" }},
        result: { uri: "test", prefLabel: { de: "Test" }},
      },
      // Test merging simple object properties
      {
        a: { prefLabel: { de: "testDe" }},
        b: { prefLabel: { en: "testEn" }},
        result: { prefLabel: { de: "testDe", en: "testEn" }},
      },
      // Test merging simple array properties
      {
        a: { test: ["a"] },
        b: { test: ["b"] },
        result: { test: ["a", "b"] },
      },
      // Test merging simple array properties with duplicate values
      {
        a: { test: ["a"] },
        b: { test: ["b","a","c"] },
        result: { test: ["a", "b", "c"] },
      },
      // Test merging null values in array
      {
        a: { test: ["a"] },
        b: { test: ["b", null] },
        result: { test: ["a", "b", null] },
      },
      // Test merging null values in array, null should be last element
      {
        a: { test: ["a", null] },
        b: { test: ["b"] },
        result: { test: ["a", "b", null] },
      },
      // Test merging null values in array, null should only appear once and at the end
      {
        a: { test: ["a", null] },
        b: { test: ["b", null] },
        result: { test: ["a", "b", null] },
      },
      // Test deep merging of arrays
      {
        a: { from: { memberSet: [{ uri: "test1" }, { uri: "test2" }] }},
        b: { from: { memberSet: [{ uri: "test1" }, { uri: "test3" }] }},
        result: { from: { memberSet: [{ uri: "test1" }, { uri: "test2" }, { uri: "test3" }] }},
      },
      // Test URI merging 1
      {
        a: { uri: "test1" },
        b: { uri: "test2" },
        options: { mergeUris: true },
        result: { uri: "test1", identifier: ["test2"] },
      },
      // Test URI merging 2 ("test1" should be removed from identifier)
      {
        a: { uri: "test1" },
        b: { uri: "test2", identifier: ["test1", "test3"] },
        options: { mergeUris: true },
        result: { uri: "test1", identifier: ["test3", "test2"] },
      },
      // Test throwing an error on simple property mismatch
      {
        a: { uri: "test1" },
        b: { uri: "test2" },
        options: { detectMismatch: ["uri"] },
        throws: true,
      },
      // Test throwing an error on deep property mismatch
      {
        a: { prefLabel: { de: "test1" }},
        b: { prefLabel: { de: "test2" }},
        options: { detectMismatch: ["prefLabel.de"] },
        throws: true,
      },
      // Test not throwing an error on deep property match
      {
        a: { prefLabel: { de: "test1" }},
        b: { prefLabel: { de: "test1" }},
        options: { detectMismatch: ["prefLabel.de"] },
        result: { prefLabel: { de: "test1" }},
      },
      // Test for skipping paths 1
      {
        a: { uri: "test1", prefLabel: { de: "test1" }},
        b: { uri: "test1" },
        options: { skipPaths: ["prefLabel"] },
        result: { uri: "test1" },
      },
      // Test for skipping paths 1
      {
        a: { uri: "test1", prefLabel: { de: "test1" }},
        b: { uri: "test1", prefLabel: { en: "test1" }},
        options: { skipPaths: ["prefLabel.en"] },
        result: { uri: "test1", prefLabel: { de: "test1" }},
      },
    ]

    for (let test of tests) {
      if (test.throws) {
        assert.throws(() => tools.merge(test.a, test.b, test.options))
      } else {
        let result = tools.merge(test.a, test.b, test.options)
        assert.deepStrictEqual(result, test.result)
      }
    }
  })

  it("normalize", () => {
    let tests = [
      {
        a: "ä",
        b: "ä",
      },
      {
        a: ["ä"],
        b: ["ä"],
      },
      {
        a: { test: [{ blubb: "ä" }] },
        b: { test: [{ blubb: "ä" }] },
      },
    ]

    for (let test of tests) {
      assert.notDeepStrictEqual(test.a, test.b)
      assert.deepStrictEqual(tools.normalize(test.a), tools.normalize(test.b))
    }
  })

  it("isValidUri", () => {
    let tests = [
      {
        uri: "",
        valid: false,
      },
      {
        uri: "test",
        valid: false,
      },
      {
        uri: "test:test",
        valid: true,
      },
      {
        uri: "http://hello world",
        valid: false,
      },
    ]

    for (let test of tests) {
      assert.equal(tools.isValidUri(test.uri), test.valid)
    }
  })

  it("compareFunctions", () => {
    // Check if functions exist
    const functions = ["mappingsByConcepts"]
    for (let func of functions) {
      assert.equal(typeof tools.compareFunctions[func] === "function", true)
    }
    // TODO: Test actual functionality
    let mappings = [
      {
        from: {
          memberSet: [
            {
              notation: ["b"],
            },
          ],
        },
      },
      {
        from: {
          memberSet: [
            {
              notation: ["a"],
            },
          ],
        },
      },
    ]
    mappings.sort((a, b) =>  tools.compareFunctions.mappingsByConcepts(a, b, "from"))
    assert.equal(mappings[0].from.memberSet[0].notation[0], "a")
    assert.equal(mappings[1].from.memberSet[0].notation[0], "b")
  })

  it("userOwnsMapping", () => {
    const user1 = {
      uri: "default:user1",
      identities: {
        provider1: {
          uri: "provider1:user1",
        },
      },
    }
    const user2 = {
      uri: "default:user2",
      identities: {
        provider1: {
          uri: "provider1:user2",
        },
      },
    }
    const mapping1 = {
      creator: [
        {
          uri: "default:user1",
        },
      ],
    }
    const mapping2 = {
      creator: [
        {
          uri: "provider1:user2",
        },
      ],
    }
    const mapping3 = {
      creator: [
        {
          uri: "provider1:user1",
        },
        {
          uri: "default:user2",
        },
      ],
    }

    const tests = [
      {
        user: user1,
        mapping: mapping1,
        result: true,
      },
      {
        user: user1,
        mapping: mapping2,
        result: false,
      },
      {
        user: user1,
        mapping: mapping3,
        result: true,
      },
      {
        user: user2,
        mapping: mapping1,
        result: false,
      },
      {
        user: user2,
        mapping: mapping2,
        result: true,
      },
      {
        user: user2,
        mapping: mapping3,
        result: false,
      },
    ]

    for (let test of tests) {
      assert.equal(tools.userOwnsMapping(test.user, test.mapping), test.result)
    }
  })

  it("notation", () => {
    let tests = [
      {
        item: {
          notation: ["1", "2"],
        },
        type: null,
        expected: "1",
        message: "Did not return the first notation",
      },
      {
        item: {
          notation: ["test"],
        },
        type: "scheme",
        expected: "TEST",
        message: "Notation for scheme should be uppercased",
      },
      {
        item: {
          notation: ["test"],
          type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
        },
        type: "null",
        expected: "TEST",
        message: "Notation for scheme should be uppercased",
      },
    ]

    for (let test of tests) {
      let notation = tools.notation(test.item, test.type)
      assert.equal(notation, test.expected, `${test.message} (actual: ${notation}, expected: ${test.expected})`)
    }
  })

  it("languageMapContent", () => {

  })

  it("prefLabel", () => {
    let tests = [
      {
        item: {
          prefLabel: {
            en: "English label",
            de: "German label",
          },
        },
        options: {},
        expected: "English label",
        message: "Did not return the expected English label",
      },
      {
        item: {
          prefLabel: {
            en: "English label",
            de: "German label",
          },
        },
        options: {
          language: "de",
        },
        expected: "German label",
        message: "Did not return the expected German label",
      },
      {
        preRun: () => {
          languagePreference.store = null
          languagePreference.defaults = ["de"]
        },
        postRun: () => {
          languagePreference.defaults = ["en"]
        },
        item: {
          prefLabel: {
            en: "English label",
            de: "German label",
          },
        },
        options: {},
        expected: "German label",
        message: "Did not return the expected German label",
      },
      {
        item: {
          uri: "test:hello",
        },
        options: {},
        expected: "test:hello",
        message: "Did not fall back to URI as expected",
      },
      {
        item: {
          uri: "test:hello",
        },
        options: {
          fallbackToUri: false,
        },
        expected: "",
        message: "Did not respect fallbackToUri option",
      },
    ]

    for (let test of tests) {
      test.preRun && test.preRun()
      let prefLabel = tools.prefLabel(test.item, test.options)
      assert.equal(prefLabel, test.expected, `${test.message} (actual: ${prefLabel}, expected: ${test.expected})`)
      test.postRun && test.postRun()
    }
  })

  it("definition", () => {
    let tests = [
      {
        item: {},
        options: {},
        expected: [],
        message: "Did not return the expected empty array",
      },
      {
        item: {
          definition: {
            en: ["English definition"],
            de: ["German definition"],
          },
        },
        options: {},
        expected: ["English definition"],
        message: "Did not return the expected English definition",
      },
      {
        item: {
          definition: {
            en: ["English definition"],
            de: ["German definition"],
          },
        },
        options: {
          language: "de",
        },
        expected: ["German definition"],
        message: "Did not return the expected German definition",
      },
      {
        preRun: () => {
          languagePreference.store = null
          languagePreference.defaults = ["de"]
        },
        postRun: () => {
          languagePreference.defaults = ["en"]
        },
        item: {
          definition: {
            en: ["English definition"],
            de: ["German definition"],
          },
        },
        options: {},
        expected: ["German definition"],
        message: "Did not return the expected German definition",
      },
      {
        item: {
          definition: {
            en: "English definition",
          },
        },
        options: {},
        expected: ["English definition"],
        message: "Did not convert defintion to array",
      },
      {
        item: {
          definition: {
            jp: ["日本語の定義"],
          },
        },
        options: {},
        expected: ["日本語の定義"],
        message: "Did not fall back to Japanese definition",
      },
    ]

    for (let test of tests) {
      test.preRun && test.preRun()
      let definition = tools.definition(test.item, test.options)
      assert.deepEqual(definition, test.expected, `${test.message} (actual: ${definition}, expected: ${test.expected})`)
      test.postRun && test.postRun()
    }
  })

  it("mappingRegistryIsStored", () => {
    const tests = [
      {
        registry: {
          stored: true,
        },
        result: true,
      },
      {
        registry: {
          stored: false,
        },
        result: false,
      },
      {
        registry: null,
        result: false,
      },
      {
        registry: {},
        result: false,
      },
      {
        registry: {
          stored: true,
          provider: {
            constructor: {
              stored: false,
            },
          },
        },
        result: true,
      },
      {
        registry: {
          stored: false,
          provider: {
            constructor: {
              stored: true,
            },
          },
        },
        result: false,
      },
    ]
    for (let test of tests) {
      assert.equal(tools.mappingRegistryIsStored(test.registry), test.result)
    }
  })

  it("annotationCreatorUri", () => {
    const tests = [
      {
        annotation: {},
        creatorUri: null,
      },
      {
        annotation: {
          creator: "test:blubb",
        },
        creatorUri: "test:blubb",
      },
      {
        annotation: {
          creator: {
            id: "test:blubb2",
            name: "test",
          },
        },
        creatorUri: "test:blubb2",
      },
    ]
    for (let test of tests) {
      const creatorUri = tools.annotationCreatorUri(test.annotation)
      assert.equal(creatorUri, test.creatorUri, `did not return the expected creator URI (actual: ${creatorUri}, expected: ${test.creatorUri})`)
    }
  })

  it("annotationCreatorName", () => {
    const tests = [
      {
        annotation: {},
        creatorName: "",
      },
      {
        annotation: {
          creator: "test:blubb",
        },
        creatorName: "",
      },
      {
        annotation: {
          creator: {
            id: "test:blubb2",
            name: "test",
          },
        },
        creatorName: "test",
      },
    ]
    for (let test of tests) {
      const creatorName = tools.annotationCreatorName(test.annotation)
      assert.equal(creatorName, test.creatorName, `did not return the expected creator name (actual: ${creatorName}, expected: ${test.creatorName})`)
    }
  })

  it("annotationCreatorMatches", () => {
    const tests = [
      {
        annotation: {},
        uris: ["test:blubb"],
        result: false,
      },
      {
        annotation: {
          creator: "test:blubb",
        },
        uris: ["test:blubb2"],
        result: false,
      },
      {
        annotation: {
          creator: "test:blubb",
        },
        uris: ["test:blubb"],
        result: true,
      },
      {
        annotation: {
          creator: {
            id: "test:blubb",
            name: "test",
          },
        },
        uris: ["test:blubb2"],
        result: false,
      },
      {
        annotation: {
          creator: {
            id: "test:blubb2",
            name: "test",
          },
        },
        uris: ["test:blubb2"],
        result: true,
      },
    ]
    for (let test of tests) {
      const result = tools.annotationCreatorMatches(test.annotation, test.uris)
      assert.equal(result, test.result, `did not return the expected creator URI (actual: ${result}, expected: ${test.result})`)
    }
  })

  it("guessSchemeFromNotation", () => {
    const schemes = [
      {uri:"x:notationPatternMissing"},
      {uri:"x:any",notationPattern:".+"},
      {uri:"x:digits",notationPattern:"0|[1-9]+"},
      {uri:"x:alpha",notationPattern:"[a-z]+"},
      {uri:"x:alphanum",notationPattern:"[a-z0-9]+"},
    ] 
    const tests = [
      [".", []],
      ["a", ["x:alpha","x:alphanum"]],
      ["123", ["x:digits","x:alphanum"]],
      ["a2", ["x:alphanum"]],
    ]
    for (let [notation,uris] of tests) {
      const found = tools.guessSchemeFromNotation(notation, schemes)
      assert.deepEqual(found.map(({uri})=>uri),uris)
    }
  })
})
