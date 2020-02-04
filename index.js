/**
 * JSKOS Tools.
 * @module jskos-tools
 */

const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")
const ConceptScheme = require("./lib/concept-scheme")
const LanguagePreference = require("./lib/language-preference")

module.exports = Object.assign({ ConceptScheme, LanguagePreference }, identifiers, tools)
