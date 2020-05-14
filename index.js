/**
 * JSKOS Tools.
 * @module jskos-tools
 */

const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")
const Resource = require("./lib/resource")
const Item = require("./lib/item")
const Concept = require("./lib/concept")
const ConceptScheme = require("./lib/concept-scheme")
const Mapping = require("./lib/mapping")
const Concordance = require("./lib/concordance")
const Occurrence = require("./lib/occurrence")
const languagePreference = require("./lib/language-preference")

module.exports = Object.assign({
  languagePreference,
  Resource,
  Item,
  Concept,
  ConceptScheme,
  Mapping,
  Concordance,
  Occurrence,
}, identifiers, tools)
