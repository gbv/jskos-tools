// pure-javascript implementation
// SubtleCrypto.digest in the browser would be faster but it's async
const rusha = require("rusha")
module.exports = data => rusha.createHash().update(data).digest("hex")
