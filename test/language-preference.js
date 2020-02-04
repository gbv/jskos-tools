const assert = require("assert")

const { LanguagePreference } = require("../index.js")

describe("LanguagePreference", () => {
  const pref1 = new LanguagePreference()

  it("selects null if no language available", () => {
    assert.equal(pref1.selectLanguage({}, null))
    assert.equal(pref1.selectLanguage(null, null))
  })

  it("selects 'en' as default", () => {
    assert.equal(pref1.selectLanguage({fr:"", es: "", en: ""}), "en")
  })

  it("selects any given language as fallback", () => {
    assert.equal(pref1.selectLanguage({fr:""}), "fr")
  })

  const pref2 = new LanguagePreference()
  pref2.defaults = ["es", "en"]

  it("can be configured via default list", () => {
    assert.equal(pref2.selectLanguage({fr:"", es: "", en: ""}), "es")
  })

  const pref3 = new LanguagePreference()
  pref3.store = { foo: { bar: ["es", "en"] } }
  pref3.path = "foo.bar"

  it("can be configured via store and path", () => {
    assert.equal(pref3.selectLanguage({fr:"", es: "", en: ""}), "es")
  })


})
