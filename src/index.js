/**
 * JSKOS Tools.
 * @module jskos-tools
 */

import ConceptScheme from "./concept-scheme.js"
export { ConceptScheme }

import { templateVariables } from "./link-template.js"
export { templateVariables }

import languagePreference from "./language-preference.js"
export { languagePreference}

import * as identifiers from "./identifiers.js"
import * as tools from "./tools.js"
import * as mapping from "./mapping.js"

export * from "./identifiers.js"
export * from "./tools.js"
export * from "./mapping.js"

export default {
  ...identifiers,
  ...tools,
  ...mapping,
  ConceptScheme,
  languagePreference,
}
