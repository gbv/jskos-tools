import * as _ from "./utils.js"
import { compare, prefLabel, copyDeep } from "./tools.js"
import mappingTypes from "./mapping-types.js"

/**
 * Returns a list of concepts for a mapping.
 *
 * @memberof module:jskos-tools
 * @param {*} mapping
 * @param {*} side - Either `from` or `to`. Default is both.
 */
export const conceptsOfMapping = (mapping, side) => {
  let concepts = []
  for (let s of ["from", "to"]) {
    if (!side || s === side) {
      concepts = concepts.concat(
        mapping?.[s]?.memberSet ||
        mapping?.[s]?.memberChoice ||
        mapping?.[s]?.memberList || [],
      )
    }
  }
  return concepts.filter(c => c != null)
}

/**
 * Returns `true` if the user owns the mapping (i.e. is first creator), `false` if not.
 *
 * @param {*} user a login-server compatible user object
 * @param {*} mapping a JSKOS mapping
 */
export const userOwnsMapping = (user, mapping) => {
  if (!user || !mapping) {
    return false
  }
  return [user.uri].concat(Object.values(user.identities || {}).map(identity => identity.uri)).filter(uri => uri != null).includes(mapping.creator?.[0]?.uri)
}

/**
 * Compare two mappings based on their properties. Concept sets and schemes are compared by URI.
 *
 * @memberof module:jskos-tools
 */
export function compareMappingsDeep(mapping1, mapping2) {
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
 * - uri: whether to include uri in output (default false)
 * - identifier: whether to include additional identifiers in output (default false)
 */
export const mappingCSV = (options = {}) => {
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
    for (let name of ["type","creator","uri","identifier"]) {
      if (options[name]) {
        fields.push(name)
      }
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
        fields.push(mapping?.[`${side}Scheme`]?.notation?.[0] || "")
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
        fields.push(concepts[i]?.notation?.[0] || "")
        // Label
        if (options.labels) {
          fields.push(prefLabel(concepts[i], { language, fallbackToUri: false }))
        }
      }
    }
    if (options.type) {
      fields.push(mappingTypeByUri(mapping.type?.[0])?.SHORT || "")
    }
    if (options.creator) {
      fields.push(prefLabel(mapping.creator?.[0], { language, fallbackToUri: false }))
    }
    if (options.uri) {
      fields.push(mapping.uri || "")
    }
    if (options.identifier) {
      fields.push((mapping.identifier || []).join("|"))
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
 * @memberof module:jskos-tools
 */
export const minifyMapping = mapping => {
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
 *
 */
export { mappingTypes }

/**
 * @memberof module:jskos-tools
 */
export const mappingTypeByUri = function(uri) {
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
export const defaultMappingType = mappingTypeByUri("http://www.w3.org/2004/02/skos/core#mappingRelation")

/**
 * @memberof module:jskos-tools
 */
export const mappingTypeByType = function(type, defaultType = defaultMappingType) {
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
 * Safely get a nested property.
 * @private
 * @param {*} object the object to access
 * @param {*} path path expression
 */
const getNested = (object, path) => path.split(".").reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, object)

/**
 * @memberof module:jskos-tools
 */
export const flattenMapping = (mapping, options = {}) => {
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
