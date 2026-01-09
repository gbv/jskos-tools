/**
 * JSKOS Tools.
 * @module jskos-tools
 */

import ConceptScheme from "./concept-scheme.js"
export { ConceptScheme }

import languagePreference from "./language-preference.js"
export { languagePreference}

import * as identifiers from "./identifiers.js"
import * as tools from "./tools.js"

export * from "./identifiers.js"
export * from "./tools.js"

export default {
  ...identifiers,
  ...tools,
  ConceptScheme,
  languagePreference,
}
