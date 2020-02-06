const assert = require("assert")

const { languagePreference } = require("../index.js")

const _ = {
  get: require("lodash/get"),
}

describe("languagePreference", () => {

  it("selects null if no language available", () => {
    assert.equal(languagePreference.selectLanguage({}), null)
    assert.equal(languagePreference.selectLanguage(null), null)
  })

  it("selects 'en' as default", () => {
    assert.equal(languagePreference.selectLanguage({ fr:"", es: "", en: "" }), "en")
  })

  it("selects any given language as fallback", () => {
    assert.equal(languagePreference.selectLanguage({ fr:"" }), "fr")
  })


  it("can be configured via default list", () => {
    const defaults = ["es", "en"]
    languagePreference.defaults = defaults
    assert.deepEqual(languagePreference.getLanguages(), defaults)
    assert.equal(languagePreference.selectLanguage({ fr:"", es: "", en: "" }), "es")
  })


  it("can be configured via store and path", () => {
    const store = { foo: { bar: ["es", "en"] } }
    const path = "foo.bar"
    languagePreference.store = store
    languagePreference.path = path
    assert.deepEqual(languagePreference.getLanguages(), _.get(store, path))
    assert.equal(languagePreference.selectLanguage({ fr:"", es: "", en: "" }), "es")
  })

})
