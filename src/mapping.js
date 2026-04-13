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
