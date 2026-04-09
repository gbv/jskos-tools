import assert from "assert"
import { templateVariables } from "../src/index.js"

const tests = [{
  concepts: [{uri:"x:1",notation:["1"]}],
  separator: null,
  languageTags: ["en", "de"],
  // expected
  uri: "x:1",
  notation: "1",
  prefLabel: "",
  language: "en",
},{
  concepts: [{uri:"x:2",prefLabel:{de:"a"}},{uri:"x:1", prefLabel: {en:"x",de:"y"}}],
  separator: "|",
  languageTags: ["en", "de"],
  // expected
  uri: "x:2|x:1",
  notation: "",
  prefLabel: "a|x",
  language: "en",
}]

describe("templateVariables", () => {
  for (let i=0; i<tests.length; i++) {
    const { concepts, separator, languageTags, uri, notation, prefLabel, language } = tests[i]
    it("example $i", () => {
      const data = templateVariables(concepts, { separator, languageTags })
      assert.deepStrictEqual(data, { uri, notation, prefLabel, language })
    })
  }
})
