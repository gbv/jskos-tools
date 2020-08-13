/**
 * Module to calculate JSKOS mapping identifiers.
 */

const sha1 = require("./sha1.js")

// Reduce JSKOS set to members with URI.
function reduceSet(set) {
  return set.map(member => member && member.uri).filter(Boolean)
}

// Tell which concept bundle field is used.
function memberField(bundle) {
  return ["memberSet", "memberList", "memberChoice"].find(f => bundle[f])
}

// Reduce JSKOS concept bundle to memberSet/List/Choice with member URIs only.
function reduceBundle(bundle) {
  const field = memberField(bundle)
  const set = bundle[field] ? reduceSet(bundle[field]) : []
  return {
    [set.length > 1 ? field : "memberSet"]: set.map(uri => ({uri})),
  }
}

// Reduce mapping to reduced fields from, to, and type.
function mappingContent(mapping) {
  const { from, to, type } = mapping
  let result = {
    from: reduceBundle(from || {}),
    to: reduceBundle(to || {}),
    type: [
      type && type[0] || "http://www.w3.org/2004/02/skos/core#mappingRelation",
    ],
  }
  for (let side of ["from", "to"]) {
    if ((result[side][memberField(result[side])] || []).length == 0) {
      let scheme = mapping[side + "Scheme"]
      if (scheme && scheme.uri) {
        // Create new object to remove all unnecessary properties.
        result[side + "Scheme"] = { uri: scheme.uri }
      }
    }
  }
  return result
}

// Get a sorted list of member URIs.
function mappingMembers(mapping) {
  const { from, to } = mapping
  const memberUris = [ from, to ].filter(Boolean)
    .map(bundle => reduceSet(bundle[memberField(bundle)] || []))
  return [].concat(...memberUris).sort()
}

/**
 * Returns a mapping content identifier. The identifier starts with `urn:jskos:mapping:content:`
 * and takes concepts and type into consideration. It uses the `mappingContent` function to get
 * relevant properties from the mapping.
 * @memberof module:jskos-tools
 */
function mappingContentIdentifier(mapping) {
  const json = JSON.stringify(mappingContent(mapping), ["from","fromScheme","to","toScheme","type","memberSet","memberList","memberChoice","uri"])
  return "urn:jskos:mapping:content:" + sha1(json+"\n")
}

/**
 * @memberof module:jskos-tools
 */
function mappingMembersIdentifier(mapping) {
  const json = JSON.stringify(mappingMembers(mapping))
  return "urn:jskos:mapping:members:" + sha1(json+"\n")
}

/**
 * @memberof module:jskos-tools
 */
function addMappingIdentifiers(mapping) {
  const identifier = (mapping.identifier || []).filter(
    id => !id.startsWith("urn:jskos:mapping:"),
  ).concat([
    mappingMembersIdentifier(mapping),
    mappingContentIdentifier(mapping),
  ]).sort()
  return Object.assign({}, mapping, {identifier})
}

function compare(mapping1, mapping2, prefix) {
  mapping1 = mapping1 && addMappingIdentifiers(mapping1)
  mapping2 = mapping2 && addMappingIdentifiers(mapping2)
  let id1 = mapping1 && mapping1.identifier ? mapping1.identifier.find(element => element.startsWith(prefix)) : null
  let id2 = mapping2 && mapping2.identifier ? mapping2.identifier.find(element => element.startsWith(prefix)) : null
  return id1 == id2
}

/**
 * @memberof module:jskos-tools
 */
function compareMappings(mapping1, mapping2) {
  return compare(mapping1, mapping2, "urn:jskos:mapping:content:")
}
const compareMappingContent = compareMappings

/**
 * @memberof module:jskos-tools
 */
function compareMappingMembers(mapping1, mapping2) {
  return compare(mapping1, mapping2, "urn:jskos:mapping:members:")
}

module.exports = {
  mappingContent,
  mappingMembers,
  mappingContentIdentifier,
  mappingMembersIdentifier,
  addMappingIdentifiers,
  compareMappings,
  compareMappingContent,
  compareMappingMembers,
}
