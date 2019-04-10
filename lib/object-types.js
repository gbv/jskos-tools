const mappingTypes = require("./mapping-types.json")

/**
 * JSKOS Concept Types indexed by primary name.
 * @memberof module:jskos-tools
 */
const objectTypes = {
  Concept: {
    type: ["http://www.w3.org/2004/02/skos/core#Concept"]
  },
  ConceptScheme: {
    type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"]
  },
  ConceptMapping: {
    type: mappingTypes.map(type => type.uri)
  },
  ConceptOccurrence: {
    type: ["http://purl.org/cld/cdtype/CatalogueOrIndex"]
  },
  Registry: {
  },
  Distribution: {
  },
  Concordance: {
    type: [
      "http://rdfs.org/ns/void#Linkset",
      "http://rdf-vocabulary.ddialliance.org/xkos#Correspondence"
    ]
  },
  Resource: {},
  Item: {}
}

// build lookup table
const objectTypeUris = Object.keys(objectTypes).reduce((map, name) => {
  for (let uri of (objectTypes[name].type || [])) {
    map[uri] = name
  }
  return map
}, {})

/**
 * Guess the JSKOS Concept Type name from an object or name.
 * @memberof module:jskos-tools
 * @param {object|string} jskos|name|uri object or string to guess from
 * @param {boolean} shortname return short name if enabled (false by default)
 */
function guessObjectType(obj, shortname=false) {
  var type
  if (typeof obj === "string" && obj) {
    if (obj in objectTypeUris) {
      // given by URI
      type = objectTypeUris[obj]
    } else {
      // given by name
      obj = obj.toLowerCase().replace(/s$/,"")
      type = Object.keys(objectTypes).find(name => {
        const lowercase = name.toLowerCase()
        if (lowercase === obj || lowercase === "concept" + obj) {
          return true
        }
      })
    }
  } else if (typeof obj === "object") {
    if (obj.type && Array.isArray(obj.type)) {
      for (let uri of obj.type) {
        if (uri in objectTypeUris) {
          type = objectTypeUris[uri]
          break
        }
      }
    }
  }
  return shortname ? type.toLowerCase().replace(/^concept(.+)/, "$1") : type
}

module.exports = { objectTypes, guessObjectType }
