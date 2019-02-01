const regexChars = /[\\^$.*+?()[\]{}|]/g
const regexEscape = string => string.replace(regexChars, "\\$&")

/**
 * A [JSKOS Concept Scheme](http://gbv.github.io/jskos/jskos.html#concept-schemes).
 * @memberof module:jskos-tools
 * @example
 * const { ConceptScheme } = require('jskos-tools')
 * let scheme = new ConceptScheme({
 *   namespace: "http://example.org/",
 *   notationPattern: "[0-9]+"
 * })
 */
class ConceptScheme {

  /**
   * @param {object} [jskos] - object that's copied as scheme (shallow copy)
   */
  constructor (scheme={}) {
    Object.assign(this, scheme)

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
   * @param {string} notation
   * @returns {array|null}
   */
  isValidNotation(notation) {
    return this.NOTATION_REGEX ? this.NOTATION_REGEX.exec(notation) : undefined
  }

  /**
   * Check whether URI belongs to the scheme, return local notation on success.
   * @param {string} uri
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
   * @param {string} notation
   * @example scheme.uriFromNotation("123") // http://example.org/123
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
   * @param {string} uri
   */
  conceptFromUri (uri) {
    const notation = this.notationFromUri(uri)
    if (notation !== undefined) {
      return { uri, notation: [notation] }
    }
  }
}

module.exports = ConceptScheme
