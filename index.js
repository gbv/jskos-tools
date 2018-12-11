const validate = require("./lib/validate")
const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")
const ConceptScheme = require("./lib/concept-scheme")
const version = "0.4.2"

module.exports = Object.assign({ validate, version, ConceptScheme}, identifiers, tools)
