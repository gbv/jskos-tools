const _ = {
  get: require("lodash/get"),
  pick: require("lodash/pick"),
  forOwn: require("lodash/forOwn"),
  isEqual: require("lodash/isEqual"),
  isEqualWith: require("lodash/isEqualWith"),
  intersection: require("lodash/intersection"),
  isArray: require("lodash/isArray"),
  isObject: require("lodash/isObject"),
  unionWith: require("lodash/unionWith"),
}

/**
 * Tests if a string only contains uppercase letters.
 * @private
 * @param {string} str
 */
const isUpperCase = str => {
  return (/^[A-Z]*$/).test(str)
}

/**
 * Safely get a nested property.
 * @private
 * @param {*} object the object to access
 * @param {*} path path expression
 */
const getNested = (object, path) => {
  return path.split(".").reduce(
    (xs, x) => (xs && xs[x]) ? xs[x] : null, object)
}

/**
 * Add @context URI to a JSKOS resource or to an array of JSKOS resources.
 * @memberof module:jskos-tools
 * @param {object} jskos object or array of objects
 */
const addContext = jskos => {
  let array = jskos instanceof Array ? jskos : [jskos]
  array.forEach(resource => {
    resource["@context"] = "https://gbv.github.io/jskos/context.json"
  })
  return jskos
}

/**
 * Recursively cleans JSKOS object by removing properties starting with _ or containing only uppercase letters.
 * Warning: Works directly on the object without creating a copy!
 * @memberof module:jskos-tools
 * @param {object} jskos
 */
const clean = jskos => {
  Object.keys(jskos).forEach(key => {
    if (isUpperCase(key) || key.startsWith("_")) {
      delete jskos[key]
    } else {
      if (jskos[key] != null && typeof jskos[key] === "object") {
        jskos[key] = clean(jskos[key])
      }
    }
  })
  return jskos
}

// cleanJSKOS as alias for clean.
const cleanJSKOS = clean

/**
 * Creates a deep copy of a JSKOS object, replacing possibly circular structures with open world [null] statements.
 * All properties starting with an underscore (_) will be ignored.
 * @memberof module:jskos-tools
 * @param {object} object
 * @param {array} replaceCircular - additional property names that should be replace with open world [null] statements
 * @param {bool} skipUnderscore - whether to skip properties starting with `_` (default `true`)
 */
const copyDeep = (object, replaceCircular = [], skipUnderscore = true) => {
  replaceCircular = replaceCircular.concat([
    "ancestors", "narrower", "broader", "mappings", "TOPCONCEPTS", "MAPPINGS", "PROVIDER"
  ])
  let clone = Array.isArray(object) ? [] : {}
  for(let i in object) {
    // Ignore all properties starting with _
    if (skipUnderscore && i[0] == "_") {
      continue
    }
    if (replaceCircular.includes(i)) {
      // Remove circular structures, replace with [null] if it has elements
      if (object[i] && Array.isArray(object[i])) {
        if (object[i].length > 0) {
          clone[i] = [null]
        } else {
          clone[i] = []
        }
        continue
      } else {
        clone[i] = null
        continue
      }
    }
    if (i == "inScheme") {
      // Remove circular structur for inScheme and replace with new object consisting only of URI, notation, and prefLabel
      let inScheme = []
      for (let scheme of object.inScheme) {
        let newScheme = { uri: scheme.uri }
        if (scheme.notation) {
          newScheme.notation = scheme.notation
        }
        if (scheme.prefLabel) {
          newScheme.prefLabel = scheme.prefLabel
        }
        inScheme.push(newScheme)
      }
      clone.inScheme = inScheme
      continue
    }
    if (object[i] != null &&  typeof(object[i]) == "object") {
      clone[i] = copyDeep(object[i])
    } else {
      clone[i] = object[i]
    }
  }
  return clone
}

// deepCopy as alias for copyDeep.
const deepCopy = copyDeep

/**
 * Returns all possible URIs for a JSKOS object. Takes into consideration both the uri and identifier properties, as well as different variants of those identifiers.
 *
 * Variants:
 * - http vs. https
 * - with trailing slash vs. without trailing slash
 * - /en/ vs. /de/
 *
 * @memberof module:jskos-tools
 * @param {object} object
 */
const getAllUris = object => {
  if (!object) return []
  let uris = (object.uri ? [object.uri] : []).concat(object.identifier || [])
  // Generate several variants of URIs to work around inconsistencies
  uris = uris.concat(uris.map(uri => uri.startsWith("https") ? uri.replace("https", "http") : uri.replace("http", "https")))
  uris = uris.concat(uris.map(uri => uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri + "/"))
  uris = uris.concat(uris.map(uri => uri.indexOf("/en/") != -1 ? uri.replace("/en/", "/de/") : uri.replace("/de/", "/en/")))
  return uris
}

/**
 * Compares two objects based on their URIs, using getAllUris.
 *
 * @memberof module:jskos-tools
 * @param {object} object1
 * @param {object} object2
 */
const compare = (object1, object2) => {
  // Return true if both objects are null.
  if (object1 == null && object2 == null) {
    return true
  }
  // Compare URIs for objects.
  let object1uris = getAllUris(object1)
  let object2uris = getAllUris(object2)
  if (_.intersection(object1uris, object2uris).length > 0) {
    return true
  } else {
    return false
  }
}

// compareObjects, compareSchemes and compareConcepts as aliases for compare, for compatibility.
const compareObjects = compare
const compareSchemes = compare
const compareConcepts = compare

/**
 * Checks whether JSKOS object is a concept based on type property.
 * @memberof module:jskos-tools
 */
const isConcept = object => {
  return _.get(object, "type", []).includes("http://www.w3.org/2004/02/skos/core#Concept") || _.get(object, "inScheme") != null || _.get(object, "topConceptOf") != null
}

/**
 * Checks whether JSKOS object is a concept scheme based on type property.
 * @memberof module:jskos-tools
 */
const isScheme = object => {
  return _.get(object, "type", []).includes("http://www.w3.org/2004/02/skos/core#ConceptScheme")
}

/**
 * Checks whether an object is contained in a list of objects using compare.
 * @memberof module:jskos-tools
 */
const isContainedIn = (object, objects) => {
  if (!object || !objects) {
    return false
  }
  for (let o of objects) {
    if (compare(object, o)) {
      return true
    }
  }
  return false
}

// isSchemeInList as alias for isContainedIn.
const isSchemeInList = isContainedIn

/**
 * Sorts a list of concepts by their notation, then URI.
 *
 * @memberof module:jskos-tools
 * @param {*} concepts
 */
const sortConcepts = (concepts, numerical = false) => {
  return concepts.sort(
    (a, b) => {
      let _a = _.get(a, "notation[0]"), _b = _.get(b, "notation[0]")
      if (_a && _b) {
        _a = _a.toLowerCase()
        _b = _b.toLowerCase()
      }
      if (numerical) {
        _a = parseFloat(_a) || _a
        _b = parseFloat(_b) || _b
      }
      // Fallback to URI
      if (!_a || !_b || _a == _b) {
        _a = a.uri
        _b = b.uri
      }
      if (_a && _b) {
        if (_a > _b) {
          return 1
        } else if (_a < _b) {
          return -1
        }
      }
      return 0
    }
  )
}

/**
 * Sorts a list of schemes by their prefLabel (German or English), then notation, then URI.
 *
 * @memberof module:jskos-tools
 * @param {*} schemes
 */
const sortSchemes = schemes => {
  let order = ["notation[0]", ["prefLabel.de", "prefLabel.en"], "uri"]
  return schemes.sort(
    (a, b) => {
      for (let path of order) {
        let _a, _b
        if (_.isArray(path)) {
          for (let path2 of path) {
            _a = _a || _.get(a, path2)
            _b = _b || _.get(b, path2)
          }
        } else {
          _a = _.get(a, path)
          _b = _.get(b, path)
        }
        if (_a != null && _b != null) {
          _a = _a.toLowerCase()
          _b = _b.toLowerCase()
          if (_a > _b) {
            return 1
          } else if (_a < _b) {
            return -1
          }
        }
      }
      return 0
    }
  )
}

/**
 * @memberof module:jskos-tools
 */
const minifyMapping = mapping => {
  let newMapping = _.pick(copyDeep(mapping), ["from", "to", "fromScheme", "toScheme", "creator", "contributor", "type", "created", "modified", "note", "identifier", "uri"])
  for (let fromTo of [newMapping.from, newMapping.to]) {
    _.forOwn(fromTo, (value, key) => {
      let conceptBundle = []
      for (let concept of value) {
        conceptBundle.push(_.pick(concept, ["uri", "notation"]))
      }
      fromTo[key] = conceptBundle
    })
  }
  if (newMapping.fromScheme) {
    newMapping.fromScheme = _.pick(newMapping.fromScheme, ["uri", "notation"])
  }
  if (newMapping.toScheme) {
    newMapping.toScheme = _.pick(newMapping.toScheme, ["uri", "notation"])
  }
  return newMapping
}

/**
 * @memberof module:jskos-tools
 *
 * Run `bin/localize-mapping-types` to update labels from Wikidata.
 */
const mappingTypes = require("./mapping-types.json")

/**
 * @memberof module:jskos-tools
 */
const mappingTypeByUri = function(uri) {
  for(let mappingType of mappingTypes) {
    if (uri == mappingType.uri) {
      return mappingType
    }
  }
  return null
}

/**
 * @memberof module:jskos-tools
 */
const defaultMappingType = mappingTypeByUri("http://www.w3.org/2004/02/skos/core#mappingRelation")

/**
 * @memberof module:jskos-tools
 */
const mappingTypeByType = function(type, defaultType = defaultMappingType) {
  let uri
  if (Array.isArray(type) && type.length > 0) {
    uri = type[0]
  } else {
    // This is a workaround for the type being a string instead of an array.
    uri = type
  }
  return mappingTypeByUri(uri) || defaultType
}

/**
 * @memberof module:jskos-tools
 */
const flattenMapping = (mapping, options = {}) => {
  const { language } = options

  let fromNotation = getNested(mapping, "from.memberSet.0.notation.0")
  let toNotation = getNested(mapping, "to.memberSet.0.notation.0")
  fromNotation = fromNotation !== null ? fromNotation : ""
  toNotation = toNotation !== null ? toNotation : ""
  let type = mappingTypeByUri(getNested(mapping, "type.0"))
  type = type ? type.short : ""

  let fromLabel = ""
  let toLabel = ""
  if (language) {
    fromLabel = getNested(mapping, `from.memberSet.0.prefLabel.${language}`)
    toLabel = getNested(mapping, `to.memberSet.0.prefLabel.${language}`)
  }

  return {fromNotation, toNotation, fromLabel, toLabel, type}
}

/**
 * @memberof module:jskos-tools
 */
const mappingToCSV = (options = {}) => {
  // CSV Dialect (see https://frictionlessdata.io/specs/csv-dialect/)
  const delimiter = options.delimiter || ","
  const quoteChar = options.quoteChar || "\""
  const lineTerminator = options.lineTerminator || "\n"
  const doubleQuote = quoteChar + quoteChar
  const language = options.language

  const quote = s => quoteChar + (s === null ? "" : s.replace(quoteChar,doubleQuote)) + quoteChar

  return mapping => {
    let { fromNotation, toNotation, fromLabel, toLabel, type }
      = flattenMapping(mapping, options)
    if (fromNotation !== "") {
      let fields = language
        ? [ fromNotation, fromLabel, toNotation, toLabel, type ]
        : [ fromNotation, toNotation, type ]
      return fields.map(quote).join(delimiter) + lineTerminator
    }
  }
}

/**
 * Returns a list of concepts for a mapping.
 *
 * @memberof module:jskos-tools
 * @param {*} mapping
 * @param {*} side - Either `from` or `to`. Default is both.
 */
const conceptsOfMapping = (mapping, side) => {
  let concepts = []
  for (let s of ["from", "to"]) {
    if (side == null || s === side) {
      concepts = concepts.concat(
        _.get(mapping, `${s}.memberSet`) ||
        _.get(mapping, `${s}.memberChoice`) ||
        _.get(mapping, `${s}.memberList`) ||
        []
      )
    }
  }
  return concepts.filter(c => c != null)
}

/**
 * Compare two mappings based on their properties. Concept sets and schemes are compared by URI.
 *
 * @memberof module:jskos-tools
 */
function compareMappingsDeep(mapping1, mapping2) {
  return _.isEqualWith(mapping1, mapping2, (object1, object2, prop) => {
    let mapping1 = { [prop]: object1 }
    let mapping2 = { [prop]: object2 }
    if (prop == "from" || prop == "to") {
      if (!_.isEqual(Object.getOwnPropertyNames(_.get(object1, prop, {})), Object.getOwnPropertyNames(_.get(object2, prop, {})))) {
        return false
      }
      return _.isEqualWith(conceptsOfMapping(mapping1, prop), conceptsOfMapping(mapping2, prop), (concept1, concept2, index) => {
        if (index != undefined) {
          return compare(concept1, concept2)
        }
        return undefined
      })
    }
    if (prop == "fromScheme" || prop == "toScheme") {
      return compare(object1, object2)
    }
    // Let lodash's isEqual do the comparison
    return undefined
  })
}

const { objectTypes, guessObjectType } = require("./object-types")

/**
 * Merges two JSKOS objects. Object properties will be merged deeply. Array properties will be combined (and URIs will be used for comparison if it's an array of objects).
 *
 * The `options` property allows for different options:
 * - `throwOnTypeMismatch` (boolean, default `true`) - throws an error if JSKOS types can be guessed for both objects and they don't match
 * - `uriMerge` (boolean, default `false`) - appends b's URI to the result's `identifier` property if necessary, removes a's URI from the result's `identifier` property if necessary (useful for merging ConceptSchemes)
 * - `throwOnMismatch` (array of strings, default `[]`) - throws an error if the value at a certain path does not match between the two objects (allows for deep properties, e.g. `prefLabel.de`)
 *
 * @memberof module:jskos-tools
 * @param {object} a
 * @param {object} b
 * @param {object} options - optional, see above
 */
const merge = (a, b, options) => {
  if (!a || !b) {
    return a ? a : b
  }
  options = options || {}
  // Path is used for deep throwOnMismatch checks
  let path = options._path || ""
  // Throw an error if two simple properties do not match between the objects
  let throwOnMismatch = options.throwOnMismatch || []
  // Throw an error if JSKOS types do not match between the objects
  if (options.throwOnTypeMismatch === undefined ? true : options.throwOnTypeMismatch) {
    // Guess object types of both objects
    let aType = guessObjectType(a), bType = guessObjectType(b)
    // If both object types could be guessed, throw an error if they don't match
    if (aType && bType && aType != bType) {
      throw new Error(`JSKOS object type mismatch (can't merge ${aType} and ${bType}).`)
    }
  }
  let result = {}
  // Merge properties that are in both objects
  _.forOwn(a, (value, key) => {
    if (_.isArray(value) && _.isArray(b[key])) {
      // Merge array properties
      result[key] = _.unionWith(value, b[key], (first, second) => {
        if (_.isObject(first) && _.isObject(second)) {
          return compare(first, second)
        }
        return first === second
      })
      // Sort null values to the end while keeping the rest of the order the same
      result[key].sort((a, b) => {
        if (a === null) {
          return 1
        }
        if (b === null) {
          return -1
        }
        return 0
      })
    } else if (_.isObject(value) && _.isObject(b[key])) {
      // Merge object properties
      result[key] = merge(value, b[key], Object.assign({ _path: `${path}${key}.` }, options))
    } else {
      if (value && b[key] && throwOnMismatch.includes(path + key) && !_.isEqual(value, b[key])) {
        throw new Error("Property mismatch in " + path + key)
      }
      result[key] = value
    }
  })
  // Add properties that are only in b
  _.forOwn(b, (value, key) => {
    if (!a[key]) {
      result[key] = value
    }
  })
  // Merge URIs by adding/removing URIs from identifier property
  if (options.uriMerge) {
    // Add b's URI to identifier if necessary
    if (result.uri && b.uri && result.uri != b.uri && !(result.identifier || []).includes(b.uri)) {
      result.identifier = (result.identifier || []).concat([b.uri])
    }
    // Remove result's URI from identifier if necessary
    if (_.isArray(result.identifier) && result.uri) {
      result.identifier = result.identifier.filter(uri => uri !== result.uri)
    }
  }
  return result
}

module.exports = {
  addContext, clean, cleanJSKOS, copyDeep, deepCopy, getAllUris, compare,compareObjects, compareSchemes, compareConcepts, isConcept, isScheme, isContainedIn, isSchemeInList, sortConcepts, sortSchemes, minifyMapping, mappingTypes, mappingTypeByUri, mappingTypeByType, flattenMapping, mappingToCSV, defaultMappingType, conceptsOfMapping, compareMappingsDeep, objectTypes, guessObjectType, merge,
}
