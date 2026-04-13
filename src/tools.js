import * as _ from "./utils.js"
import { objectTypes, guessObjectType, usedObjectTypes } from "./object-types.js"
import ConceptScheme from "./concept-scheme.js"
import languagePreference from "./language-preference.js"

/**
 * Add @context URI to a JSKOS resource or to an array of JSKOS resources.
 * @memberof module:jskos-tools
 * @param {object} jskos object or array of objects
 */
export const addContext = jskos => {
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
export const clean = jskos => {
  Object.keys(jskos).forEach(key => {
    if ((/^[A-Z]*$/).test(key) || key.startsWith("_")) {
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
export const cleanJSKOS = clean

/**
 * Creates a deep copy of a JSKOS object, replacing possibly circular structures with open world [null] statements.
 * All properties starting with an underscore (_) will be ignored.
 * @memberof module:jskos-tools
 * @param {object} object
 * @param {array} replaceCircular - additional property names that should be replace with open world [null] statements
 * @param {bool} skipUnderscore - whether to skip properties starting with `_` (default `true`)
 */
export const copyDeep = (object, replaceCircular = [], skipUnderscore = true) => {
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
export const deepCopy = copyDeep

/**
 * Returns all possible URIs for a JSKOS object. Takes into consideration both the uri and identifier properties.
 *
 * @memberof module:jskos-tools
 * @param {object} object
 */
export const getAllUris = object => {
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
export const compare = (object1, object2) => {
  // Return true if both objects are null.
  if (object1 == null && object2 == null) {
    return true
  }
  // Normalize all URIs to http:// for comparison
  const replaceUri = uri => uri.replace("https://", "http://")
  const object1uris = getAllUris(object1).map(replaceUri)
  // Check if any of object2's URIs is in object1's URIs.
  for (let uri of getAllUris(object2).map(replaceUri)) {
    if (object1uris.indexOf(uri) !== -1) {
      return true
    }
  }
  return false
}

/**
 * Checks whether JSKOS object is a concept based on type property.
 * @memberof module:jskos-tools
 */
export const isConcept = object => {
  return object?.type?.includes("http://www.w3.org/2004/02/skos/core#Concept") ||
         object?.inScheme != null || object?.topConceptOf != null
}

/**
 * Checks whether JSKOS object is a concept scheme based on type property.
 * @memberof module:jskos-tools
 */
export const isScheme = object => object?.type?.includes("http://www.w3.org/2004/02/skos/core#ConceptScheme")

/**
 * Checks whether an object is contained in a list of objects using compare.
 * @memberof module:jskos-tools
 */
export const isContainedIn = (object, objects) => {
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
export const isSchemeInList = isContainedIn

/**
 * Sorts a list of concepts by their notation, then URI.
 *
 * @memberof module:jskos-tools
 * @param {*} concepts
 */
export const sortConcepts = (concepts, numerical = false) => {
  return concepts.sort(
    (a, b) => {
      let _a = a?.notation?.[0], _b = b?.notation?.[0]
      if (_a && _b) {
        _a = _a.toLowerCase()
        _b = _b.toLowerCase()
      }
      if (numerical && _a && _b) {
        let __a, __b
        __a = parseFloat(_a)
        __b = parseFloat(_b)
        if (!__a && !__b) {
          // Split notations into parts
          const _a_split = `${_a}`.split(/[^\w\d]/)
          const _b_split = `${_b}`.split(/[^\w\d]/)
          for (let i = 0; i < Math.min(_a_split.length, _b_split.length); i += 1) {
            if (_a_split[i] !== _b_split[i]) {
              __a = parseFloat(_a_split[i]) || _a_split[i]
              __b = parseFloat(_b_split[i]) || _b_split[i]
              break
            }
          }
          if (!__a && !__b) {
            __a = _a
            __b = _b
          }
        }
        _a = __a
        _b = __b
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
export const sortSchemes = schemes => {
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
 * Checks if two objects have a matching object type. Returns false only if types for both objects could be guessed and they did not match.
 *
 * @memberof module:jskos-tools
 * @param {object} a
 * @param {object} b
 */
export const matchObjectTypes = (a, b) => {
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
export const mergeUris = (a, b) => {
  if (!a || !b) {
    return a
  }
  // Merge identifier array
  if (Array.isArray(a.identifier) || Array.isArray(b.identifier)) {
    a.identifier = [...new Set([...(a.identifier || []), ...(b.identifier || [])])]
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
export const merge = (a, b, options) => {
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
export const normalize = data => {
  if (Array.isArray(data)) {
    return data.map(element => normalize(element))
  } else if (_.isObject(data)) {
    _.forOwn(data, (value, key) => {
      data[key] = normalize(value)
    })
    return data
  } else {
    if (typeof data === "string") {
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
export const isValidUri = (uri) => {
  // from: http://jmrware.com/articles/2009/uri_regexp/URI_regex.html
  const re_js_rfc3986_URI = /^[A-Za-z][A-Za-z0-9+\-.]*:(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?$/
  return uri.match(re_js_rfc3986_URI) !== null
}

/**
 * An object of compare functions (can be used by array.sort for example).
 *
 * TODO: Add more functions.
 */
export const compareFunctions = {
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
 * Returns the primary notation for a JSKOS Item. If there is no notation, it will return an empty string.
 * Scheme notations will be uppercased.
 *
 * @param {object} item a JSKOS Item
 * @param {string} type type of item (optional)
 */
export function notation(item, type) {
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
export function languageMapContent(item, prop, { language } = {}) {
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
export function prefLabel(item, options = {}) {
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
export function definition(item, options = {}) {
  options = options || {}
  let content = _.get(item, `definition.${options.language}`)
    || languageMapContent(item, "definition", options)
    || []
  // Make sure an array is returned
  return typeof content === "string" ? [content] : content
}

/**
 * Returns whether a mapping registry has stored mappings (`true` = database) or not (`false` = recommendations).
 *
 * @param {object} registry JSKOS registry
 */
export function mappingRegistryIsStored(registry) {
  return (registry?.stored ?? registry?.constructor?.stored ?? registry?.provider?.constructor?.stored) || false
}

/**
 * Returns the creator URI for an annotation.
 *
 * @param {object} annotation a JSKOS annotation
 */
export const annotationCreatorUri = ({ creator }) => typeof creator === "string" ? creator : creator?.id

/**
 * Returns the creator name for an annotation.
 *
 * @param {object} annotation a JSKOS annotation
 */
export const annotationCreatorName = ({ creator }) => creator?.name || ""

/**
 * Matches an annotation's creator URI against a list of URIs (e.g. from a user).
 *
 * @param {object} annotation a JSKOS annotation
 * @param {array} uris array of user URIs
 */
export const annotationCreatorMatches = ({ creator }, uris) => uris?.includes(annotationCreatorUri({ creator }))

export function guessSchemeFromNotation(notation, schemes) {
  return schemes.filter(({notationPattern}) => {
    if ((notationPattern||".+") === ".+") {
      return false
    }
    return RegExp("^(" + notationPattern + ")$").test(notation)
  })
}

export { guessObjectType, objectTypes, usedObjectTypes }
