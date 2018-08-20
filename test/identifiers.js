const assert = require("assert")
const identifiers = require("../lib/identifiers")

let examples =
[
  {
    mapping: {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.112/e23/"
          }
        ]
      },
      fromScheme: {
        uri: "http://bartoc.org/en/node/241"
      },
      to: {
        memberSet: [
          {
            uri: "http://rvk.uni-regensburg.de/nt/WW_8844"
          }
        ]
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/533"
      },
      type: [
        "http://www.w3.org/2004/02/skos/core#mappingRelation"
      ]
    },
    contentId: "urn:jskos:mapping:content:ecfbefed9712bf4b5c90269ddbb6788bff15b7d6",
    memberId: "urn:jskos:mapping:members:60db81bc36d826b5a4164f8184593e723a45e874",
  },
  {
    mapping: {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.112/e23/"
          }
        ]
      },
      fromScheme: {
        uri: "http://bartoc.org/en/node/241"
      },
      to: {
        memberSet: [
          {
            uri: "http://rvk.uni-regensburg.de/nt/WW_8844"
          }
        ]
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/533"
      },
      type: [
        "http://www.w3.org/2004/02/skos/core#closeMatch"
      ]
    },
    contentId: "urn:jskos:mapping:content:1390cef486ef701f5de02cba042e605c58e71fd6",
    memberId: "urn:jskos:mapping:members:60db81bc36d826b5a4164f8184593e723a45e874",
  },
  {
    mapping: {
      from: {
        memberSet: [
          {
            uri: "http://dewey.info/class/612.112/e23/"
          }
        ]
      },
      fromScheme: {
        uri: "http://bartoc.org/en/node/241"
      },
      to: {
        memberSet: [
          {
            uri: "http://rvk.uni-regensburg.de/nt/WW_8840"
          }
        ]
      },
      toScheme: {
        uri: "http://bartoc.org/en/node/533"
      },
      type: [
        "http://www.w3.org/2004/02/skos/core#mappingRelation"
      ]
    },
    contentId: "urn:jskos:mapping:content:fa693e08d92696e453208ce478e988434cc73a0e",
    memberId: "urn:jskos:mapping:members:1c76d05b5d223acb96bd41687e1f3900aa8b908c"
  },
]

describe("JSKOS Mapping Identifiers", () => {

  it("should get the right mappingContentIdentifier", () => {
    for (let example of examples) {
      assert.equal(identifiers.mappingContentIdentifier(example.mapping), example.contentId)
    }
  })

  it("should get the right mappingMembersIdentifier", () => {
    for (let example of examples) {
      assert.equal(identifiers.mappingMembersIdentifier(example.mapping), example.memberId)
    }
  })

  it("should add identifiers to the mapping", () => {
    for (let example of examples) {
      let mapping = identifiers.addMappingIdentifiers(example.mapping)
      assert.ok(mapping.identifier != null)
      assert.ok(mapping.identifier.includes(example.contentId))
      assert.ok(mapping.identifier.includes(example.memberId))
    }
  })

})
