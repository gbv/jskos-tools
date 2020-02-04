const _ = {
  get: require("lodash/get"),
}

/**
 * Provides access to a preference list of language tags.
 * @memberof module:jskos-tools
 */
class LanguagePreference {

  constructor() {
    this.store = null
    this.path = ""
    this.defaults = ["en"]
  }

  /**
   * Get the preference list either from store or from defaults (fallback)
   */
  getLanguages() {
    return _.get(this.store, this.path) || this.defaults
  }

  /**
   * Selects a language tag from a language map or null if no language was found.
   *
   * @param {*} language map to select language tag from
   */
  selectLanguage(languageMap) {

    if (!languageMap) {
      return null
    }

    for (let language of this.getLanguages()) {
      if (language in languageMap) {
        return language
      }
    }

    // fallback: iterate through languages and choose the first one
    for (let language of Object.keys(languageMap)) {
      if (language != "-") {
        return language
      }
    }
    
    return null
  }
}

module.exports = LanguagePreference
