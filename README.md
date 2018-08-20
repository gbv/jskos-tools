# JSKOS Tools *(jskos-tools)*

[![Build Status](https://travis-ci.com/gbv/jskos-tools.svg?branch=master)](https://travis-ci.com/gbv/jskos-tools)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Tools for working with the JSKOS data format.

This repository contains tools for working with the [JSKOS data format for knowledge organization systems](http://gbv.github.io/jskos/).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Validation](#validation)
  - [Mapping Identifiers](#mapping-identifiers)
  - [Tools](#tools)
    - [clean](#clean)
    - [copyDeep](#copydeep)
    - [getAllUris](#getalluris)
    - [compare](#compare)
    - [isConcept](#isconcept)
    - [isScheme](#isscheme)
    - [isContainedIn](#iscontainedIn)
    - [sortConcepts](#sortconcepts)
    - [sortSchemes](#sortschemes)
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

```javascript
const jskos = require("jskos-tools")
```

### Validation

```javascript
let concept = {
  ...
}

jskos.validate.concept(concept) // returns true or false
// or jskos.validate.scheme(scheme)
// or jskos.validate.mapping(mapping)
// ...
```

Directory `bin` also contains a command line script for validation.

### Mapping Identifiers

```javascript
let mapping = {
  ...
}

// mappingContentIdentifier starts with urn:jskos:mapping:content: and takes concepts and type into consideration.
let contentIdentifier = jskos.mappingContentIdentifier(mapping)
// mappingMembersIdentifier starts with urn:jskos:mapping:members: and only takes concepts into consideration.
let membersIdentifier = jskos.mappingMembersIdentifier(mapping)
// addMappingIdentifiers creates a new mapping with property "identifiers", containing mappingContentIdentifier and mappingMembersIdentifier.
let mappingWithIdentifiers = jskos.addMappingIdentifiers(mapping)
```

### Tools

#### clean
Removes properties starting with `_` or containing only uppercase letters from a JSKOS object.

```javascript
jskos.clean(object)
```

Aliases: `cleanJSKOS`

#### copyDeep
Creates a deep copy of a JSKOS object, replacing possibly circular structures with open world `[null]` statements.

```javascript
jskos.copyDeep(object)
```

Aliases: `deepCopy`

#### getAllUris
Returns all possible URIs for a JSKOS object. Takes into consideration both the uri and identifier properties, as well as different variants of those identifiers.

```javascript
jskos.getAllUris(object)
```

#### compare
Compares two objects based on their URIs, using `getAllUris`.

```javascript
jskos.compare(object1, object2)
```

Aliases: `compareObjects`, `compareSchemes`, `compareConcepts`

#### isConcept
Checks whether JSKOS object is a concept based on type property.

```javascript
jskos.isConcept(object)
```

#### isScheme
Checks whether JSKOS object is a concept scheme based on type property.

```javascript
jskos.isScheme(object)
```

#### isContainedIn
// Checks whether an object is contained in a list of objects using `compare`.

```javascript
jskos.isContainedIn(object, listOfObjects)
```

Aliases: `isSchemeInList`

#### sortConcepts
Sorts a list of concepts by their notation, then URI. Returns a copy of the list.

```javascript
jskos.sortConcepts(concepts)
```

#### sortSchemes
Sorts a list of schemes by their German prefLabel, then URI. Returns a copy of the list.

```javascript
jskos.sortSchemes(schemes)
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
