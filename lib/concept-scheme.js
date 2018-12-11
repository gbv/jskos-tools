const regexChars = /[\\^$.*+?()[\]{}|]/g
const regexEscape = string => string.replace(regexChars, "\\$&")

class ConceptScheme {

  /**
   * Construct from given object (shallow copy).
   */
  constructor (object={}) {
    Object.assign(this, object)

    if (this.notationPattern) {
      this.NOTATION_REGEX = RegExp("^" + this.notationPattern + "$")

      if (!this.uriPattern && this.namespace) {
        this.uriPattern = "^" + regexEscape(this.namespace) 
          + "(" + this.notationPattern + ")$"
      }
    }

    if (this.uriPattern) {
      this.URI_REGEX = RegExp(this.uriPattern)
    }
  }

  /**
   * Check whether a string is a valid notation.
   */
  isValidNotation(notation) {
    return this.NOTATION_REGEX ? this.NOTATION_REGEX.exec(notation) : undefined
  }

  /**
   * Check whether URI belongs to the scheme, return local notation on success.
   */
  notationFromUri(uri) {
    if (this.URI_REGEX) {
      const match = this.URI_REGEX.exec(uri)
      if (match) {
        return decodeURI(match[1])
      }
    }
  }

  /**
   * Map local notation to URI. Does not check whether notation is valid!
   */
  uriFromNotation (notation) {
    if (this.uriPattern) {
      notation = encodeURI(notation)
      return this.uriPattern
        .replace(/^\^|\$$/g, "").replace(/\\/g, "").replace(/\(.*\)/, notation)
    }
  }

  /**
   * Check whether URI belongs to the scheme, return concept on success.
   */
  conceptFromUri (uri) {
    const notation = this.notationFromUri(uri)
    if (notation !== undefined) {
      return { uri, notation: [notation] }
    }
  }
}

module.exports = ConceptScheme
