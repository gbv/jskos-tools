const assert = require("assert")
const { validate } = require("../index")

let concept = {
  uri: "https://example.com/concept"
}

describe("JSKOS JSON Schemas Module", () => {
  it("should validate concept", () => {
    assert.equal(validate.concept(concept), true, "did not validate correctly")
  })
})
