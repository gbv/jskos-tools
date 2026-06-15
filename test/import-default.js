import jskos from "../src/index.js"
import assert from "assert"

it("should export a default object", () => assert.ok(jskos.objectTypes))
it("should export all symbols", () => assert.ok(jskos.flattenMapping))
