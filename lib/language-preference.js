const _ = {
  get: require("lodash/get"),
}

const languagePreference = {
  store: null,
  path: "",
  defaults: ["en"],
  getLanguages,
  selectLanguage,
}

/**
 * Get the preference list either from store or from defaults (fallback)
 */
function getLanguages() {
  return _.get(languagePreference.store, languagePreference.path) || languagePreference.defaults
}

/**
 * Selects a language tag from a language map or null if no language was found.
 *
 * @param {object} languageMap map to select language tag from
 */
function selectLanguage(languageMap) {

  if (!languageMap) {
    return null
  }

  for (let language of getLanguages()) {
    if (languageMap[language]) {
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

module.exports = languagePreference
