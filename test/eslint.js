const lint = require("mocha-eslint")

// ESLint as part of the tests
lint(["."], { contextName: "ESLint" })
