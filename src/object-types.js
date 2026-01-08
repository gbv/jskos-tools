import mappingTypes from "./mapping-types.js"

/**
 * JSKOS Concept Types indexed by primary name (CamelCase).
 * 
 * For historical reasons name of Mapping is "ConceptMapping" and name of
 * Occurrence is "ConceptOccurrence".
 *
 * @memberof module:jskos-tools
 */
export const objectTypes = {
  Concept: {
    type: ["http://www.w3.org/2004/02/skos/core#Concept"],
  },
  ConceptScheme: {
    type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
  },
  ConceptMapping: {
    type: mappingTypes.map(type => type.uri),
  },
  ConceptOccurrence: {},
  Registry: {
    type: [
      "http://www.w3.org/ns/dcat#Catalog",
      "http://purl.org/cld/cdtype/CatalogueOrIndex",
    ],
  },
  Distribution: {
    type: [
      "http://www.w3.org/ns/dcat#Distribution",
    ],
  },
  Service: {
    type: [
      "http://www.w3.org/ns/dcat#DataService",
    ],
  },
  Dataset: {
    type: [
      "http://www.w3.org/ns/dcat#Dataset",
    ],
  },
  Concordance: {
    type: [
      "http://rdf-vocabulary.ddialliance.org/xkos#Correspondence",
      "http://rdfs.org/ns/void#Linkset",
      "http://purl.org/spar/fabio/VocabularyMapping",
    ],
  },
  Resource: {},
  Item: {},
  ConceptBundle: {},
  Annotation: {
    type: [
      "Annotation",
      "http://www.w3.org/ns/oa#Annotation",
    ],
  },
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
 *
 * Short names are lowercase and object types `ConceptOccurrence`, `ConceptMapping`,
 * `ConceptBundle` have short name `occurrence`, `mapping` , and `bundle` respectively.
 *
 * @memberof module:jskos-tools
 * @param {object|string} jskos|name|uri object or string to guess from
 * @param {boolean} shortname return short name if enabled (false by default)
 */
export function guessObjectType(obj, shortname=false) {
  let type
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
    if (obj.type) {
      let types = Array.isArray(obj.type) ? obj.type : [obj.type]
      for (let uri of types) {
        if (uri in objectTypeUris) {
          type = objectTypeUris[uri]
          break
        }
      }
    }
  }
  return (shortname && type) ? type.toLowerCase().replace(/^concept(.+)/, "$1") : type
}

/**
 * Returns an array of main object type URIs used in a dataset.
 *
 * This checks whether and which of fields `concepts`, `types`, `mappings`,
 * `schemes`, `concordances`, `occurrences`, `registries`, `properties`, and
 * `annotations` are used with non-empty sets.
 *
 * Existence of property `properties` is indicated with URI <http://www.w3.org/1999/02/22-rdf-syntax-ns#Property>.
 * Existence of property `types` is indicated with URI <http://www.w3.org/2002/07/owl#Class>.
 *
 * @memberof module:jskos-tools
 */ 
export function usedObjectTypes(obj) {
  const types = []

  const uris = {
    concepts: "http://www.w3.org/2004/02/skos/core#Concept",
    schemes: "http://www.w3.org/2004/02/skos/core#ConceptScheme",
    mappings: "http://www.w3.org/2004/02/skos/core#mappingRelation",
    concordances: "http://rdf-vocabulary.ddialliance.org/xkos#Correspondence",
    // occurrences: "", # TODO
    registries: "http://www.w3.org/ns/dcat#Catalog",
    types: "http://www.w3.org/2002/07/owl#Class",
    properties: "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
    annotations: "http://www.w3.org/ns/oa#Annotation",
  }

  for (let field in uris) {
    if (obj[field]?.find(x => x !== null)) {
      types.push(uris[field])
    }
  }

  return types.sort()
}
