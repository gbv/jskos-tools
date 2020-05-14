const jskos = require("./tools")

/**
 * A [JSKOS Resource](https://gbv.github.io/jskos/jskos.html#resource).
 *
 * @memberof module:jskos-tools
 */
class Resource {

  /**
   *
   * @param {Object} [object={}] object whose properties are copied into the Resource
   */
  constructor(object = {}) {
    for (let key of Object.keys(object)) {
      // Only copy keys which don't override native functionality.
      if (this[key] === undefined) {
        this[key] = object[key]
      }
    }
  }

  /**
   * Compares this resource with another JSKOS Resource.
   *
   * @param {Resource} other another JSKOS Resource
   * @returns {boolean} true if they have a matching identifier (`uri` or `identifier`)
   */
  compare(other) {
    return jskos.compare(this, other)
  }

}

module.exports = Resource
