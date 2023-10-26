const _ = require("./utils")

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
    "ancestors", "narrower", "broader", "mappings", "memberList", "TOPCONCEPTS", "MAPPINGS", "PROVIDER",
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
 * Returns all possible URIs for a JSKOS object. Takes into consideration both the uri and identifier properties.
 *
 * @memberof module:jskos-tools
 * @param {object} object
 */
const getAllUris = object => {
  if (!object) {
    return []
  }
  return (object.uri ? [object.uri] : []).concat(object.identifier || []).filter(Boolean)
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
  const replaceUri = uri => uri.replace("http://").replace("https://")
  let object1uris = getAllUris(object1).map(replaceUri)
  let object2uris = getAllUris(object2).map(replaceUri)
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
    },
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
        if (Array.isArray(path)) {
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
    },
  )
}

/**
 * @memberof module:jskos-tools
 */
const minifyMapping = mapping => {
  let newMapping = _.pick(copyDeep(mapping), ["from", "to", "fromScheme", "toScheme", "creator", "contributor", "type", "created", "modified", "note", "identifier", "uri", "partOf", "mappingRelevance"])
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
  if (newMapping.partOf) {
    newMapping.partOf = newMapping.partOf.map(c => _.pick(c, ["uri"]))
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
  type = type ? type.SHORT : ""

  let fromLabel = prefLabel(getNested(mapping, "from.memberSet.0"), { language, fallbackToUri: false }) || ""
  let toLabel = prefLabel(getNested(mapping, "to.memberSet.0"), { language, fallbackToUri: false }) || ""
  let creator = prefLabel(getNested(mapping, "creator.0"), { language, fallbackToUri: false }) || ""

  return {fromNotation, toNotation, fromLabel, toLabel, type, creator}
}

/**
 * Returns a function to serialize an array as CSV row as configured.
 * See CSV Dialect (<https://frictionlessdata.io/specs/csv-dialect/>).
 *
 * @memberof module:jskos-tools
 */
const csvSerializer = (options = {}) => {
  const delimiter = options.delimiter || ","
  const quoteChar = options.quoteChar || "\""
  const lineTerminator = options.lineTerminator || "\n"
  const doubleQuote = quoteChar + quoteChar
  const quote = s => quoteChar + (s == null ? "" : s.split(quoteChar).join(doubleQuote)) + quoteChar

  return row => row.map(quote).join(delimiter) + lineTerminator
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
        [],
      )
    }
  }
  return concepts.filter(c => c != null)
}

/**
 * Returns an object of preconfigured conversion functions to convert mappings into CSV.
 *
 * @memberof module:jskos-tools
 * @param {object} options
 *
 * Possible options:
 * - delimiter: delimiter character (default `,`)
 * - quoteChar: quote character (default `"`)
 * - lineTerminator: line terminator (default `\n`)
 * - type: whether to include mapping type in output (default true)
 * - schemes: whether to include scheme notations in output (default false)
 * - labels: whether to include concept labels in output (default false)
 * - creator: whether to include mapping creator in output (default false)
 *
 */
const mappingCSV = (options = {}) => {
  const toCSV = csvSerializer(options)
  const language = options.language || "en"
  if (options.type == null) {
    options.type = true
  }

  const header = (mappings) => {
    mappings = mappings || []
    let fields = []
    for (let side of ["from", "to"]) {
      // Scheme
      if (options.schemes) {
        fields.push(`${side}Scheme`)
      }
      // Minimum count: 1 (for 1-to-1 mappings)
      let conceptCount = Math.max(...mappings.map(mapping => conceptsOfMapping(mapping, side).length), 1)
      for (let i = 0; i < conceptCount; i += 1) {
        // Notation
        fields.push(`${side}Notation${i ? i + 1 : ""}`)
        // Label
        if (options.labels) {
          fields.push(`${side}Label${i ? i + 1 : ""}`)
        }
      }
    }
    // Type
    if (options.type) {
      fields.push("type")
    }
    // Creator
    if (options.creator) {
      fields.push("creator")
    }
    return toCSV(fields)
  }

  /**
   * Converts a single mapping into a CSV line.
   *
   * @param {*} mapping a single mapping
   * @param {*} options2 an options object with properties `fromCount` and `toCount`
   */
  const fromMapping = (mapping, options2 = {}) => {
    let fields = []
    for (let side of ["from", "to"]) {
      // Scheme
      if (options.schemes) {
        fields.push(_.get(mapping, `${side}Scheme.notation[0]`, ""))
      }
      const concepts = conceptsOfMapping(mapping, side)
      let conceptCount = options2[`${side}Count`]
      if (conceptCount == null) {
        conceptCount = concepts.length
      }
      // Minimum count: 1 (for 1-to-1 mappings)
      conceptCount = Math.max(conceptCount, 1)
      for (let i = 0; i < conceptCount; i += 1) {
        // Notation
        fields.push(_.get(concepts[i], "notation[0]", ""))
        // Label
        if (options.labels) {
          fields.push(prefLabel(concepts[i], { language, fallbackToUri: false }))
        }
      }
    }
    // Type
    if (options.type) {
      fields.push(_.get(mappingTypeByUri(_.get(mapping, "type[0]")), "SHORT", ""))
    }
    // Creator
    if (options.creator) {
      fields.push(prefLabel(_.get(mapping, "creator[0]"), { language, fallbackToUri: false }))
    }
    return toCSV(fields)
  }

  /**
   * Converts an array of mappings into CSV.
   *
   * @param {*} mapping an array of mappings
   * @param {*} options2 an options object with optional property `header` (default true)
   */
  const fromMappings = (mappings, options2 = { header: true }) => {
    let result = ""
    if (options2.header) {
      result += header(mappings)
    }
    const fromMappingOptions = {
      fromCount: Math.max(...mappings.map(mapping => conceptsOfMapping(mapping, "from").length)),
      toCount: Math.max(...mappings.map(mapping => conceptsOfMapping(mapping, "to").length)),
    }
    for (let mapping of mappings) {
      result += fromMapping(mapping, fromMappingOptions)
    }
    return result
  }

  return {
    header,
    fromMapping,
    fromMappings,
  }
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
      if (!_.isEqualWith(Object.getOwnPropertyNames(_.get(object1, prop, {})), Object.getOwnPropertyNames(_.get(object2, prop, {})))) {
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
 * Checks if two objects have a matching object type. Returns false only if types for both objects could be guessed and they did not match.
 *
 * @memberof module:jskos-tools
 * @param {object} a
 * @param {object} b
 */
const matchObjectTypes = (a, b) => {
  // Guess object types of both objects
  let aType = guessObjectType(a), bType = guessObjectType(b)
  // If both object types could be guessed, throw an error if they don't match
  if (aType && bType && aType != bType) {
    return false
  }
  return true
}

/**
 * Sorts an array so that `null` values are at the end.
 *
 * @private
 * @param {*} array
 */
const _nullSort = (array) => {
  if (Array.isArray(array)) {
    array.sort((a, b) => {
      if (a === null) {
        return 1
      }
      if (b === null) {
        return -1
      }
      return 0
    })
  }
}

/**
 * Merge URIs of two objects `a` and `b` into `a` by adding/removing URIs from identifier property.
 *
 * @memberof module:jskos-tools
 * @param {object} a
 * @param {object} b
 */
const mergeUris = (a, b) => {
  if (!a || !b) {
    return a
  }
  // Merge identifier array
  if (Array.isArray(a.identifier) || Array.isArray(b.identifier)) {
    a.identifier = _.union(a.identifier || [], b.identifier || [])
  }
  // Add URI to a if necessary
  if (!a.uri && b.uri) {
    a.uri = b.uri
  }
  // Add b's URI to a's identifier if necessary
  if (a.uri && b.uri && a.uri != b.uri && !(a.identifier || []).includes(b.uri)) {
    a.identifier = (a.identifier || []).concat([b.uri])
  }
  // Remove a's URI from identifier if necessary
  if (Array.isArray(a.identifier) && a.uri) {
    a.identifier = a.identifier.filter(uri => uri !== a.uri)
  }
  // Remove identifier property if empty
  if ((a.identifier || []).length == 0) {
    delete a.identifier
  }
  // Sort null values to end
  _nullSort(a.identifier)
  return a
}

/**
 * Merges two JSKOS objects. Object properties will be merged deeply. Array properties will be combined (and URIs will be used for comparison if it's an array of objects).
 *
 * The `options` property allows for different options:
 * - `mergeUris` (boolean, default `false`) - appends b's URI to the result's `identifier` property if necessary, removes a's URI from the result's `identifier` property if necessary (useful for merging ConceptSchemes)
 * - `detectMismatch` (array of strings, default `[]`) - throws an error if the value at a certain path does not match between the two objects (allows for deep properties, e.g. `prefLabel.de`)
 * - `skipPaths` (array of strings, default `[]`) - provide paths to completely skip when merging
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
  // Path is used for deep detectMismatch checks
  let path = options._path || ""
  // Throw an error if two simple properties do not match between the objects
  let detectMismatch = options.detectMismatch || []
  let skipPaths = options.skipPaths || []
  let result = {}
  // Merge properties that are in both objects
  _.forOwn(a, (value, key) => {
    // Skip path if necessary
    if (skipPaths.includes(path + key)) {
      return
    }
    if (Array.isArray(value) && Array.isArray(b[key])) {
      // Merge array properties
      result[key] = _.unionWith(value, b[key], (first, second) => {
        if (_.isObject(first) && _.isObject(second)) {
          return compare(first, second)
        }
        return first === second
      })
      // Sort null values to the end while keeping the rest of the order the same
      _nullSort(result[key])
    } else if (_.isObject(value) && _.isObject(b[key])) {
      // Merge object properties
      result[key] = merge(value, b[key], Object.assign({ _path: `${path}${key}.` }, options))
    } else {
      if (value && b[key] && detectMismatch.includes(path + key) && !_.isEqualWith(value, b[key])) {
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
  // Remove paths if necessary
  if (path == "") {
    _.omitMod(result, skipPaths)
  }
  // Merge URIs if necessary
  if (options.mergeUris) {
    mergeUris(result, b)
  }
  return result
}

/**
 * Applies recursive unicode normalization to data.
 *
 * - If data is an array, it will recursively normalize all elements of that array.
 * - If data is an object, it will recursively normalize all property values of that object.
 * - If data is a string, it will apply unicode normalization to that string.
 * - If data is of any other type, it will be returned as is.
 *
 * @param {*} data
 */
const normalize = data => {
  if (Array.isArray(data)) {
    return data.map(element => normalize(element))
  } else if (_.isObject(data)) {
    _.forOwn(data, (value, key) => {
      data[key] = normalize(value)
    })
    return data
  } else {
    if (_.isString(data)) {
      return data.normalize()
    } else {
      return data
    }
  }
}

/**
 * Checks whether a string is a valid URI.
 *
 * @param {string} uri URI to be tested
 */
let isValidUri = (uri) => {
  // from: http://jmrware.com/articles/2009/uri_regexp/URI_regex.html
  var re_js_rfc3986_URI = /^[A-Za-z][A-Za-z0-9+\-.]*:(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?$/
  return uri.match(re_js_rfc3986_URI) !== null
}

/**
 * An object of compare functions (can be used by array.sort for example).
 *
 * TODO: Add more functions.
 */
let compareFunctions = {
  /**
   * Compare mappings by their first concept.
   *
   * @param {*} mapping1 - first mapping
   * @param {*} mapping2 - second mapping
   * @param {*} fromTo - side, either `from` or `to`
   */
  mappingsByConcepts: (mapping1, mapping2, fromTo) => {
    let bundleFields = ["memberSet", "memberList", "memberChoice"], notation1, notation2
    for (let field of bundleFields) {
      notation1 = notation1 || _.get(mapping1, fromTo + "." + field + "[0].notation[0]")
      notation2 = notation2 || _.get(mapping2, fromTo + "." + field + "[0].notation[0]")
    }
    if (notation1 == null || notation1 < notation2) {
      return -1
    }
    if (notation2 == null || notation1 > notation2) {
      return 1
    }
    return 0
  },
}

/**
 * Returns `true` if the user owns the mapping (i.e. is first creator), `false` if not.
 *
 * @param {*} user a login-server compatible user object
 * @param {*} mapping a JSKOS mapping
 */
const userOwnsMapping = (user, mapping) => {
  if (!user || !mapping) {
    return false
  }
  return [user.uri].concat(Object.values(user.identities || {}).map(identity => identity.uri)).filter(uri => uri != null).includes(_.get(mapping, "creator[0].uri"))
}

const ConceptScheme = require("./concept-scheme")
const languagePreference = require("./language-preference")

/**
 * Returns the primary notation for a JSKOS Item. If there is no notation, it will return an empty string.
 * Scheme notations will be uppercased.
 *
 * @param {object} item a JSKOS Item
 * @param {string} type type of item (optional)
 */
function notation(item, type) {
  let notation
  if (item && item.notation && item.notation.length) {
    notation = item.notation[0]
    if (isScheme(item) || type == "scheme") {
      notation = notation.toUpperCase()
    }
  } else if (item && item.inScheme && item.inScheme[0] && item.uri) {
    // Try to imply notation from scheme and concept URI
    try {
      const scheme = new ConceptScheme(item && item.inScheme && item.inScheme[0])
      notation = scheme.notationFromUri(item.uri)
    } catch (error) {
      // Ignore error
    }
  }
  return notation || ""
}

/**
 * Returns the content of a language map for a JSKOS Item.
 *
 * @param {*} item a JSKOS Item
 * @param {string} prop property of interest in the item
 * @param {object} options options object:
 * - `language`: preferred language
 */
function languageMapContent(item, prop, { language } = {}) {
  let languageMap = (item && prop) ? item[prop] : item
  if (languageMap) {
    if (languageMap[language]) {
      return languageMap[language]
    }
    language = languagePreference.selectLanguage(languageMap)
    if (language) {
      return languageMap[language]
    }
  }
  return null
}

/**
 * Returns the prefLabel of a JSKOS Item. If there is no label, it will return the URI. If there is no URI, it will return an empty string.
 *
 * @param {*} item
 * @param {object} options options object:
 * - `fallbackToUri`: return URI if no prefLabel can be found (default: true)
 * - `language`: preferred language
 */
function prefLabel(item, options = {}) {
  options = options || {}
  const fallbackToUri = options.fallbackToUri == null ? true : options.fallbackToUri
  return _.get(item, `prefLabel.${options.language}`)
    || languageMapContent(item, "prefLabel", options)
    || ((fallbackToUri && item && item.uri) ? item.uri : "")
}

/**
 * Returns the definition of a JSKOS Item as an array. If there is no definition, an empty array will be returned.
 *
 * @param {*} item
 * @param {object} options options object:
 * - `language`: preferred language
 */
function definition(item, options = {}) {
  options = options || {}
  let content = _.get(item, `definition.${options.language}`)
    || languageMapContent(item, "definition", options)
    || []
  // Make sure an array is returned
  if (_.isString(content)) {
    content = [content]
  }
  return content
}

/**
 * Returns whether a mapping registry has stored mappings (`true` = database) or not (`false` = recommendations).
 *
 * @param {object} registry JSKOS registry
 */
function mappingRegistryIsStored(registry) {
  return _.get(registry, "stored", _.get(registry, "constructor.stored", _.get(registry, "provider.constructor.stored", false)))
}

/**
 * Returns the creator URI for an annotation.
 *
 * @param {object} annotation a JSKOS annotation
 */
function annotationCreatorUri(annotation) {
  if (_.isString(annotation.creator)) {
    return annotation.creator
  }
  return annotation.creator && annotation.creator.id
}

/**
 * Returns the craetor name for an annotation.
 *
 * @param {object} annotation a JSKOS annotation
 */
function annotationCreatorName(annotation) {
  return _.get(annotation, "creator.name") || ""
}

/**
 * Matches an annotation's creator URI against a list of URIs (e.g. from a user).
 *
 * @param {object} annotation a JSKOS annotation
 * @param {array} uris array of user URIs
 */
function annotationCreatorMatches(annotation, uris) {
  return !!(annotation && _.isString(annotation.creator) ? uris && uris.includes(annotation.creator) : uris && annotation.creator && uris.includes(annotation.creator.id))
}


module.exports = {
  addContext, clean, cleanJSKOS, copyDeep, deepCopy, getAllUris, compare,compareObjects, compareSchemes, compareConcepts, isConcept, isScheme, isContainedIn, isSchemeInList, sortConcepts, sortSchemes, minifyMapping, mappingTypes, mappingTypeByUri, mappingTypeByType, flattenMapping, mappingCSV, defaultMappingType, conceptsOfMapping, compareMappingsDeep, objectTypes, guessObjectType, matchObjectTypes, mergeUris, merge, normalize, isValidUri, compareFunctions, userOwnsMapping, notation, languageMapContent, prefLabel, definition, mappingRegistryIsStored, annotationCreatorUri, annotationCreatorName, annotationCreatorMatches,
}
