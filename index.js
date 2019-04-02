/**
 * JSKOS Tools.
 * @module jskos-tools
 */

const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")
const ConceptScheme = require("./lib/concept-scheme")

module.exports = Object.assign({ ConceptScheme }, identifiers, tools)
