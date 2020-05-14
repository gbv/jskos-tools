const Item = require("./Item")

/**
 * A [JSKOS Concept](https://gbv.github.io/jskos/jskos.html#concept).
 *
 * @memberof module:jskos-tools
 */
class Concept extends Item {

  /**
   * Concept constructor. Will set default `type` if necessary.
   *
   * @param {Object} [object={}] object whose properties are copied into the Resource
   */
  constructor(object = {}) {
    super(object)
    // Set default type
    if (!this.type || !this.type.length) {
      this.type = ["http://www.w3.org/2004/02/skos/core#Concept"]
    }
  }

}

module.exports = Concept
