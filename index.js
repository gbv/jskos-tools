const ajv = new require("ajv")({ extendRefs: true })

let schemas = {
  resource: require("./schemas/resource.schema.json"),
  item: require("./schemas/item.schema.json"),
  concept: require("./schemas/concept.schema.json"),
  scheme: require("./schemas/scheme.schema.json"),
  mapping: require("./schemas/mapping.schema.json"),
  concordance: require("./schemas/concordance.schema.json"),
  registry: require("./schemas/registry.schema.json"),
  distribution: require("./schemas/distribution.schema.json"),
  occurrence: require("./schemas/occurrence.schema.json"),
  conceptBundle: require("./schemas/conceptBundle.schema.json")
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
