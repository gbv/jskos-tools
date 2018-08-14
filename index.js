const ajv = new require("ajv")({ extendRefs: true })

let schemas = {
  resource: require("./jskos/schemas/resource.schema.json"),
  item: require("./jskos/schemas/item.schema.json"),
  concept: require("./jskos/schemas/concept.schema.json"),
  scheme: require("./jskos/schemas/scheme.schema.json"),
  mapping: require("./jskos/schemas/mapping.schema.json"),
  concordance: require("./jskos/schemas/concordance.schema.json"),
  registry: require("./jskos/schemas/registry.schema.json"),
  distribution: require("./jskos/schemas/distribution.schema.json"),
  occurrence: require("./jskos/schemas/occurrence.schema.json"),
  conceptBundle: require("./jskos/schemas/conceptBundle.schema.json")
}
let types = Object.keys(schemas)

for (let type of types) {
  ajv.addSchema(schemas[type])
}
let validate = {}
for (let type of types) {
  validate[type] = ajv.compile(schemas[type])
}

module.exports = { validate }
