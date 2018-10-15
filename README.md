# JSKOS Tools *(jskos-tools)*

[![Build Status](https://travis-ci.com/gbv/jskos-tools.svg?branch=master)](https://travis-ci.com/gbv/jskos-tools)
[![GitHub package version](https://img.shields.io/github/package-json/v/gbv/jskos-tools.svg?label=version)](https://github.com/gbv/jskos-tools)
[![NPM package name](https://img.shields.io/badge/npm-jskos--tools-blue.svg)](https://www.npmjs.com/package/jskos-tools)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Tools for working with the JSKOS data format.

This repository contains tools for working with the [JSKOS data format for knowledge organization systems](http://gbv.github.io/jskos/).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Validation](#validation)
    - [validate](#validate)
    - [version](#version)
  - [Mapping Identifiers](#mapping-identifiers)
    - [mappingContentIdentifier](#mappingcontentidentifier)
    - [mappingMembersIdentifier](#mappingmembersidentifier)
    - [addMappingIdentifiers](#addmappingidentifiers)
    - [compareMappings](#comparemappings)
    - [compareMappingMembers](#comparemappingmembers)
  - [Tools](#tools)
    - [addContext](#addContext)
    - [clean](#clean)
    - [copyDeep](#copydeep)
    - [getAllUris](#getalluris)
    - [compare](#compare)
    - [isConcept](#isconcept)
    - [isScheme](#isscheme)
    - [isContainedIn](#iscontainedin)
    - [sortConcepts](#sortconcepts)
    - [sortSchemes](#sortschemes)
    - [minifyMapping](#minifymapping)
    - [mappingTypes](#mappingtypes)
    - [mappingTypeByUri](#mappingtypebyuri)
    - [mappingTypeByType](#mappingtypebytype)
    - [defaultMappingType](#defaultmappingtype)
    - [mappingToCSV](#mappingtocsv)
    - [conceptsOfMapping](#conceptsofmapping)
- [Build](#build)
- [Test](#test)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install

```bash
npm i jskos-tools
```

## Usage

```js
const jskos = require("jskos-tools")
```

### Validation

#### validate

```js
let concept = {
  ...
}

jskos.validate.concept(concept) // returns true or false
// or jskos.validate.scheme(scheme)
// or jskos.validate.mapping(mapping)
// ...
```

Directory `bin` also contains a command line script for validation.

#### version
Returns the version of the JSKOS specification that's used for validation.

```js
jskos.version // 0.4.2
```

### Mapping Identifiers

```js
let mapping = {
  ...
}
```

#### mappingContentIdentifier
`mappingContentIdentifier` starts with urn:jskos:mapping:content: and takes concepts and type into consideration. It uses the `mappingContent` function to get relevant properties from the mapping.

```js
let contentIdentifier = jskos.mappingContentIdentifier(mapping)
```

#### mappingMembersIdentifier
`mappingMembersIdentifier` starts with urn:jskos:mapping:members: and only takes concepts into consideration. It uses the `mappingMembers` function to get relevant properties from the mapping.

```js
let membersIdentifier = jskos.mappingMembersIdentifier(mapping)
```

#### addMappingIdentifiers
`addMappingIdentifiers` creates a new mapping with property "identifiers", containing mappingContentIdentifier and mappingMembersIdentifier.

```js
let mappingWithIdentifiers = jskos.addMappingIdentifiers(mapping)
```

#### compareMappings
`compareMappings` compares two mappings based on their `mappingContentIdentifier`.

```js
if (jskos.compareMappings(mapping1, mapping2)) { ... }
```

Aliases: `compareMappingContent`

#### compareMappingMembers
`compareMappingMembers` compares two mappings based on their `mappingMembersIdentifier`.

```js
if (jskos.compareMappingMembers(mapping1, mapping2)) { ... }
```

### Tools

#### addContext
Add `@context` URI to a JSKOS object or to an array of JSKOS objects.

```js
jskos.addContext(object)
```

#### clean
Removes properties starting with `_` or containing only uppercase letters from a JSKOS object.

```js
jskos.clean(object)
```

Aliases: `cleanJSKOS`

#### copyDeep
Creates a deep copy of a JSKOS object, replacing possibly circular structures with open world `[null]` statements.

```js
jskos.copyDeep(object)
```

Aliases: `deepCopy`

#### getAllUris
Returns all possible URIs for a JSKOS object. Takes into consideration both the uri and identifier properties, as well as different variants of those identifiers. Returns an empty array if object is `null`.

```js
jskos.getAllUris(object)
```

#### compare
Compares two objects based on their URIs, using `getAllUris`. Returns `true` if both objects are `null`.

```js
jskos.compare(object1, object2)
```

Aliases: `compareObjects`, `compareSchemes`, `compareConcepts`

#### isConcept
Checks whether JSKOS object is a concept based on type property.

```js
jskos.isConcept(object)
```

#### isScheme
Checks whether JSKOS object is a concept scheme based on type property.

```js
jskos.isScheme(object)
```

#### isContainedIn
// Checks whether an object is contained in a list of objects using `compare`.

```js
jskos.isContainedIn(object, listOfObjects)
```

Aliases: `isSchemeInList`

#### sortConcepts
Sorts a list of concepts by their notation, then URI. Returns a copy of the list.

```js
jskos.sortConcepts(concepts)
```

#### sortSchemes
Sorts a list of schemes by their German prefLabel, then URI. Returns a copy of the list.

```js
jskos.sortSchemes(schemes)
```

#### minifyMapping
Removes unnecessary properties from mapping before export or saving. In particular, all properties except for `to`, `from`, `toScheme`, `fromScheme`, `type`, and `creator` on the mapping will be removed, and all properties except for `uri` and `notation` on concepts and schemes will be removed.

```js
let newMapping = jskos.minifyMapping(mapping)
```

#### mappingTypes
An array of mapping types in form of objects. Objects can have the following properties:

- `notation` - an array of notations (in this case symbols)
- `uri` - the URI of the mapping type
- `prefLabel` - a language maps of labels
- `broader` - array of broader mapping types for this type
- `related` - array of related mapping types
- `RELEVANCE` - relevance label for GND terms (low, medium, high, very high)
- `short` - a short name for the type, used for CSV import/export

Example object:
```json
{
  "notation": ["≈"],
  "uri": "http://www.w3.org/2004/02/skos/core#closeMatch",
  "prefLabel": { "en": "close match" },
  "broader": [ { "uri": "http://www.w3.org/2004/02/skos/core#mappingRelation" } ],
  "RELEVANCE": "high",
  "short": "close"
}
```

#### mappingTypeByUri
Returns a mapping type object for an URI.

```js
jskos.mappingTypeByUri("http://www.w3.org/2004/02/skos/core#closeMatch")
```

#### mappingTypeByType
Returns a mapping type for a JSKOS type property. This is usually an array where the first type is taken, but a workaround for string types is included as well.

```js
jskos.mappingTypeByType(mapping.type)
```

#### defaultMappingType
The default mapping type (currently `mapping relation`).

#### mappingToCSV
Returns a configured converter from JSKOS mapping to CSV line. For now only simple 1-to-1 mappings and 1-to-0 mappings are supported.

```js
let mappingToCsv = jskos.mappingToCSV({ delimiter: ';' })
mappingToCsv(mapping)
```

Concept labels are included only if configuration field `language` is set. The order of CSV fields is fromNotation, (fromLabel,) toNotation, (toLabel,) mappingType.

#### conceptsOfMapping
Returns an array of concepts contained in a mapping. `side` can either be `from` or `to`. If `side` is left out, concepts from both sides will be returned.

```js
jskos.conceptsOfMapping(mapping)
```

## Build

```bash
git clone --recursive https://github.com/gbv/jskos-tools.git
cd jskos-tools/
npm install
```

## Test

```bash
npm test
```

## Maintainers

- [@stefandesu](https://github.com/stefandesu)
- [@nichtich](https://github.com/nichtich)

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © 2018 Verbundzentrale des GBV (VZG)
