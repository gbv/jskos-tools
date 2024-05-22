const regexChars = /[\\^$.*+?()[\]{}|]/g
const regexEscape = string => string.replace(regexChars, "\\$&")

// Special characters that uriPattern can be build with
// Some other special characters such as [ and ] will not work!
const notationEscapeChars = /[%ÄÖÜäöü ]/g

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

    if (!this.notationPattern) {
      this.notationPattern = ".+"
    }

    if (!this.uriPattern && this.namespace) {
      this.uriPattern = "^" + regexEscape(this.namespace)
      const escaped = this.notationPattern.replace(notationEscapeChars, encodeURI)
      this.uriPattern += "(" + escaped  + ")$"
    }

    this.NOTATION_REGEX = RegExp("^(" + this.notationPattern + ")$")

    if (this.uriPattern) {
      this.URI_REGEX = RegExp(this.uriPattern)
    }
  }

  /**
   * Check whether a string is a valid notation as defined by `notationPattern`.
   * @param {string} notation
   * @returns {array|null}
   */
  isValidNotation(notation) {
    return this.NOTATION_REGEX.exec(notation)
  }

  /**
   * Check whether URI belongs to the scheme, return local notation on success.
   * Requires scheme to have `uriPattern` or `namespace`.
   * @param {string} uri
   * @returns {string|undefined}
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
   * Requires scheme to have `uriPattern` or `namespace`.
   * @param {string} notation
   * @example scheme.uriFromNotation("123") // http://example.org/123
   */
  uriFromNotation (notation) {
    if (this.uriPattern) {
      notation = encodeURIComponent(notation)
      return this.uriPattern
        .replace(/^\^|\$$/g, "").replace(/\\/g, "").replace(/\(.*\)/, notation)
    }
  }

  /**
   * Check whether URI belongs to the scheme, return concept on success.
   * Requires scheme to have `uriPattern` or `namespace`.
   * @param {string} uri
   * @param {object} [options] boolean flags `inScheme` and `toConcept`
   */
  conceptFromUri (uri, options={}) {
    const notation = this.notationFromUri(uri)
    if (notation === undefined) {
      return
    }
    const concept = { uri, notation: [notation] }
    if (options.inScheme) {
      concept.inScheme = [{uri: this.uri }]
    }
    if (options.topConcept) {
      concept.topConceptOf = [{uri: this.uri }]
    }
    return concept
  }

  /**
   * Map local notation to concept, if notation is valid. Requires scheme to
   * have `uriPattern` or `namespace`.
   * @param {string} notation
   * @param {object} [options] same as conceptFromUri options
   */
  conceptFromNotation (notation, options) {
    if (this.isValidNotation(notation)) {
      return this.conceptFromUri(this.uriFromNotation(notation), options)
    }
  }
}

export default ConceptScheme
