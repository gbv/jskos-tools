// synchronous calculation of SHA1 digest
module.exports = (() => {
  try {
    // nodejs core module, if available
    const crypto = require( "crypto" )
    return data => crypto.createHash("sha1").update(data).digest("hex")
  } catch (e) {
    return require("./sha1-browser.js")
  }
})()
