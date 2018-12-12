/**
 * JSKOS Tools.
 * @module jskos-tools
 */

/**
 * Version of the [JSKOS specification](http://gbv.github.io/jskos/)
 * that this module is based on.
 */
const version = "0.4.2"

const validate = require("./lib/validate")
const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")
const ConceptScheme = require("./lib/concept-scheme")

module.exports = Object.assign({ validate, version, ConceptScheme}, identifiers, tools)
