const Item = require("./Item")
const tools = require("./tools")

/**
 * A [JSKOS Mapping](https://gbv.github.io/jskos/jskos.html#concept-mappings).
 *
 * @memberof module:jskos-tools
 */
class Mapping extends Item {

  /**
   * Mapping constructor. Will set default `type` if necessary.
   *
   * @param {Object} [object={}] object whose properties are copied into the Resource
   */
  constructor(object = {}) {
    super(object)
    // Set default type
    if (!this.type || !this.type.length) {
      this.type = [tools.defaultMappingType.uri]
    }
  }

  /**
   * Returns a minified version of this mapping.
   *
   * @returns {Object}
   */
  minify() {
    return tools.minifyMapping(this)
  }

  /**
   * Returns a list of concepts contained in the mapping.
   *
   * @param {string} [side] either "from" or "to", defaults to both sides
   * @returns {Concept[]} array of concepts
   */
  concepts(side) {
    return tools.conceptsOfMapping(this, side)
  }

  /**
   * Compare this mapping with another mapping based on their properties. Concept sets and schemes are compared by URI.
   *
   * @param {Mapping} mapping other mapping
   * @returns {boolean}
   */
  compareDeep(mapping) {
    return tools.compareMappingsDeep(this, mapping)
  }

  /**
   * Returns `true` if the user owns this mapping (i.e. is first creator), `false` if not.
   *
   * @param {*} user a login-server compatible user object
   * @returns {boolean}
   */
  isOwnedByUser(user) {
    return tools.userOwnsMapping(user, this)
  }

}

module.exports = Mapping
