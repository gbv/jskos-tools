const validate = require("./lib/validate")
const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")
const version = "0.4.2"

module.exports = Object.assign({ validate, version }, identifiers, tools)
