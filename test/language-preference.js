import assert from "assert"
import { languagePreference } from "../index.js"
import _ from "lodash"

describe("languagePreference", () => {

  it("selects null if no language available", () => {
    assert.equal(languagePreference.selectLanguage({}), null)
    assert.equal(languagePreference.selectLanguage(null), null)
  })

  it("selects 'en' as default", () => {
    assert.equal(languagePreference.selectLanguage({ fr: "a", es: "b", en: "c" }), "en")
  })

  it("selects any given language as fallback", () => {
    assert.equal(languagePreference.selectLanguage({ fr: "a" }), "fr")
  })


  it("can be configured via default list", () => {
    const defaults = ["es", "en"]
    languagePreference.defaults = defaults
    assert.deepEqual(languagePreference.getLanguages(), defaults)
    assert.equal(languagePreference.selectLanguage({ fr: "a", es: "b", en: "c" }), "es")
  })


  it("can be configured via store and path", () => {
    const store = { foo: { bar: ["es", "en"] } }
    const path = "foo.bar"
    languagePreference.store = store
    languagePreference.path = path
    assert.deepEqual(languagePreference.getLanguages(), _.get(store, path))
    assert.equal(languagePreference.selectLanguage({ fr: "a", es: "b", en: "c" }), "es")
  })

})
