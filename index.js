/**
 * JSKOS Tools.
 * @module jskos-tools
 */

export * from "./lib/identifiers.js"
export * from "./lib/tools.js"

import ConceptScheme from "./lib/concept-scheme.js"
export { ConceptScheme }

import languagePreference from "./lib/language-preference.js"
export { languagePreference}

import * as identifiers from "./lib/identifiers.js"
import * as tools from "./lib/tools.js"

export default {
  ...identifiers,
  ...tools,
  ConceptScheme,
  languagePreference,
}
