import assert from "assert"
import { conceptsOfMapping, userOwnsMapping, compareMappingsDeep, mappingCSV, minifyMapping } from "../src/index.js"

describe("mapping", () => {

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
        assert.equal(conceptsOfMapping(mapping, side).length, mapping[`${side}Result`])
      }
      // Test total
      assert.equal(conceptsOfMapping(mapping).length, mapping["fromResult"]+mapping["toResult"])
    }
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
      assert.equal(userOwnsMapping(test.user, test.mapping), test.result)
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
    assert.ok(compareMappingsDeep(mapping1, mapping2))
    assert.ok(!compareMappingsDeep(mapping2, mapping3))
    assert.ok(!compareMappingsDeep(mapping3, mapping4))
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
        assert.equal(mappingCSV(options[optionType])[testCase.function](testCase.param), testCase.results[optionType])
      }
    }

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
    let newMapping = minifyMapping(mapping)
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
    let emptyNewMapping = minifyMapping({})
    assert.equal(Object.keys(emptyNewMapping).length, 0, "minifyMapping added properties to empty mapping")
  })

})
