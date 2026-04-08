/**
 * Module to calculate JSKOS mapping identifiers.
 */

import sha1 from "./sha1.js"

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
export function mappingContent(mapping) {
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
export function mappingMembers(mapping) {
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
export function mappingContentIdentifier(mapping) {
  const json = JSON.stringify(mappingContent(mapping), ["from","fromScheme","to","toScheme","type","memberSet","memberList","memberChoice","uri"])
  return "urn:jskos:mapping:content:" + sha1(json+"\n")
}

/**
 * @memberof module:jskos-tools
 */
export function mappingMembersIdentifier(mapping) {
  const json = JSON.stringify(mappingMembers(mapping))
  return "urn:jskos:mapping:members:" + sha1(json+"\n")
}

/**
 * Returns a hex SHA-256 digest of a UTF-8 input string using the Web Crypto API.
 * @param {string} input
 * @returns {Promise<string>}
 */
const getSHA256Hash = async (input) => {
  const textAsBuffer = new TextEncoder().encode(input)
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", textAsBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
  return hash
}

/**
 * Compares two strings by Unicode code point order
 * @param {string} left
 * @param {string} right
 * @returns {number} Negative, zero, or positive.
 */
function codePointCompare (left, right) {
  const leftIter = left[Symbol.iterator]()
  const rightIter = right[Symbol.iterator]()
  for (;;) {
    const { value: leftChar } = leftIter.next()
    const { value: rightChar } = rightIter.next()
    if (leftChar === undefined && rightChar === undefined) {
      return 0
    } else if (leftChar === undefined) {
      // left is a prefix of right.
      return -1
    } else if (rightChar === undefined) {
      // right is a prefix of left.
      return 1
    }
    const leftCodepoint = leftChar.codePointAt(0)
    const rightCodepoint = rightChar.codePointAt(0)
    if (leftCodepoint < rightCodepoint) {
      return -1
    }
    if (leftCodepoint > rightCodepoint) {
      return 1
    }
  }
}

/**
 * Returns a mapping sameness identifier
 * The identifier starts with `mapping:` followed by a SHA-256 hex digest,
 * and ends with `~` when `negativity` is true.
 * @memberof module:jskos-tools
 * @param {{ subjects: string[], objects: string[], predicate: string, negativity: boolean }} mapping
 * @returns {Promise<string>}
 */
export async function mappingSamenessIdentifier(mapping) {
  const { subjects, objects, predicate, negativity } = mapping

  subjects.sort(codePointCompare)
  objects.sort(codePointCompare)

  const str = [subjects.join("|"), predicate, objects.join("|")].join(" ")
  const digest = await getSHA256Hash(str)

  return `mapping:${digest}${negativity ? "~" : ""}`
}

/**
 * @memberof module:jskos-tools
 */
export async function addMappingIdentifiers(mapping) {
  const fromField = memberField(mapping.from || {})
  const toField = memberField(mapping.to || {})
  const subjects = fromField ? reduceSet(mapping.from[fromField]) : []
  const objects = toField ? reduceSet(mapping.to[toField]) : []
  const predicate = mapping.type?.[0]
    ?? "http://www.w3.org/2004/02/skos/core#mappingRelation"

  const identifier = (mapping.identifier || []).filter(
    id => id && !id.startsWith("urn:jskos:mapping:") && !id.startsWith("mapping:"),
  ).concat([
    mappingMembersIdentifier(mapping),
    mappingContentIdentifier(mapping),
    await mappingSamenessIdentifier({ subjects, objects, predicate, negativity: false }),
  ]).sort()
  return Object.assign({}, mapping, {identifier})
}

function compare(mapping1, mapping2, prefix) {
  let id1 = mapping1 ? (prefix === "urn:jskos:mapping:content:" ? mappingContentIdentifier(mapping1) : mappingMembersIdentifier(mapping1)) : null
  let id2 = mapping2 ? (prefix === "urn:jskos:mapping:content:" ? mappingContentIdentifier(mapping2) : mappingMembersIdentifier(mapping2)) : null
  return id1 == id2
}

/**
 * @memberof module:jskos-tools
 */
export function compareMappings(mapping1, mapping2) {
  return compare(mapping1, mapping2, "urn:jskos:mapping:content:")
}
export const compareMappingContent = compareMappings

/**
 * @memberof module:jskos-tools
 */
export function compareMappingMembers(mapping1, mapping2) {
  return compare(mapping1, mapping2, "urn:jskos:mapping:members:")
}
