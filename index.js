const validate = require("./lib/validate")
const identifiers = require("./lib/identifiers")
const tools = require("./lib/tools")

module.exports = Object.assign({ validate }, identifiers, tools)
