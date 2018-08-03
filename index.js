const ajv = new require("ajv")({ extendRefs: true })

let schemas = {
  resource: require("./schemas/resource.schema.json"),
  item: require("./schemas/item.schema.json"),
  concept: require("./schemas/concept.schema.json"),
  scheme: require("./schemas/scheme.schema.json"),
  mapping: require("./schemas/mapping.schema.json"),
  occurrence: require("./schemas/occurrence.schema.json")
}
let types = Object.keys(schemas)

ajv.addSchema(schemas.resource)
ajv.addSchema(schemas.item)
let validate = {}
for (let type of types) {
  validate[type] = ajv.compile(schemas[type])
}

module.exports = { validate }
