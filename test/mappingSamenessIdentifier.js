import assert from "assert"
import { mappingSamenessIdentifier, addMappingIdentifiers } from "../src/identifiers.js"

const examples = [
  {
    name: "1-to-1",
    mapping: {
      subjects: ["http://example.org/feline"],
      objects: ["http://example.com/cat"],
      predicate: "http://www.w3.org/2002/07/owl#sameAs",
      negativity: false,
    },
    id: "mapping:95a088082ab2b2a68638aebbcc3fe3e0f229da75a8b5bdbb9f3f8cd5e1e4286e",
  },
  {
    name: "complex",
    mapping: {
      subjects: ["http://example.org/red", "http://example.org/blue"],
      objects: ["http://example.com/green"],
      predicate: "http://www.w3.org/2004/02/skos/core#closeMatch",
      negativity: true,
    },
    id: "mapping:424e7a86ea29d5a0aaf1d3d7da9a864b48121ac465c67163aef56f6f87bb1ba8~",
  },
  {
    name: "sort-by-codepoint",
    mapping: {
      subjects: ["x:\uff42", "x:\uD835\uDDBA", "x:c"],
      objects: ["x:letter"],
      predicate: "x:is",
      negativity: false,
    },
    id: "mapping:d1bbf3098de14c48971f01b3c884c7657fc42f00edabe1065045ce50e5966678",
  },
]

describe("Mapping Sameness Identifier", () => {

  it("should compute correct identifiers for all reference examples", async () => {
    for (const example of examples) {
      assert.strictEqual(
        await mappingSamenessIdentifier(example.mapping),
        example.id,
        `failed for: ${example.name}`,
      )
    }
  })

  it("should append ~ for negative mappings", async () => {
    const id = await mappingSamenessIdentifier({
      subjects: ["x:a"],
      objects: ["x:b"],
      predicate: "x:p",
      negativity: true,
    })
    assert.ok(id.endsWith("~"), `expected id to end with ~, got: ${id}`)
  })

  it("should not append ~ for non-negative mappings", async () => {
    const id = await mappingSamenessIdentifier({
      subjects: ["x:a"],
      objects: ["x:b"],
      predicate: "x:p",
      negativity: false,
    })
    assert.ok(!id.endsWith("~"), `expected id not to end with ~, got: ${id}`)
  })

  it("should produce the same identifier regardless of subject/object input order", async () => {
    const id1 = await mappingSamenessIdentifier({
      subjects: ["x:a", "x:b"],
      objects: ["x:z"],
      predicate: "x:p",
      negativity: false,
    })
    const id2 = await mappingSamenessIdentifier({
      subjects: ["x:b", "x:a"],
      objects: ["x:z"],
      predicate: "x:p",
      negativity: false,
    })
    assert.strictEqual(id1, id2)
  })

  it("should add sameness identifier in addMappingIdentifiers", async () => {
    const mapping = {
      from: { memberSet: [{ uri: "http://example.org/feline" }] },
      to: { memberSet: [{ uri: "http://example.com/cat" }] },
      type: ["http://www.w3.org/2002/07/owl#sameAs"],
    }
    const result = await addMappingIdentifiers(mapping)
    const samenessId = result.identifier.find(id => id.startsWith("mapping:"))
    assert.ok(samenessId != null, "sameness identifier should be present")
    // Verify it matches directly computed value
    const expected = await mappingSamenessIdentifier({
      subjects: ["http://example.org/feline"],
      objects: ["http://example.com/cat"],
      predicate: "http://www.w3.org/2002/07/owl#sameAs",
      negativity: false,
    })
    assert.strictEqual(samenessId, expected)
  })

  it("should replace existing sameness identifier in addMappingIdentifiers", async () => {
    const mapping = {
      from: { memberSet: [{ uri: "http://example.org/feline" }] },
      to: { memberSet: [{ uri: "http://example.com/cat" }] },
      type: ["http://www.w3.org/2002/07/owl#sameAs"],
      identifier: ["mapping:olddeadbeef"],
    }
    const result = await addMappingIdentifiers(mapping)
    const samenessIds = result.identifier.filter(id => id.startsWith("mapping:"))
    assert.strictEqual(samenessIds.length, 1)
    assert.ok(!samenessIds[0].includes("olddeadbeef"))
  })

})
