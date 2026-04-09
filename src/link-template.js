// <https://gbv.github.io/jskos/#expansion-of-link-templates>
export function templateVariables(concepts, { separator, languageTags }={}) {
  if (separator === null || separator === undefined) {
    concepts = concepts.slice(0,1)
  }

  const uri = concepts.filter(c => "uri" in c).map(c => c.uri).join(separator)
  const notation = concepts.filter(c => c.notation?.length).map(c => c.notation[0]).join(separator)
  const prefLabel = concepts.map(c => {
    const labels = c.prefLabel || {}
    const tag = (languageTags || []).find(tag => tag in labels) // TODO: matching of subtags?
    return labels[tag] || ""
  }).filter(l => l).join(separator)
  const language = languageTags[0]  

  return { uri, notation, prefLabel, language }
}
