const Item = require("./Item")

/**
 * A [JSKOS Concordance](https://gbv.github.io/jskos/jskos.html#concordances).
 *
 * @memberof module:jskos-tools
 */
class Concordance extends Item {

  /**
   * Concordance constructor. Will set default `type` if necessary.
   *
   * @param {Object} [object={}] object whose properties are copied into the Resource
   */
  constructor(object = {}) {
    super(object)
    // Set default type
    if (!this.type || !this.type.length) {
      this.type = ["http://rdfs.org/ns/void#Linkset"]
    }
  }

}

module.exports = Concordance
