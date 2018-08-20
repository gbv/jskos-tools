# JSKOS Tools

[![Build Status](https://travis-ci.com/gbv/jskos-tools.svg?branch=master)](https://travis-ci.com/gbv/jskos-tools)

> Tools for working with the JSKOS data format.

This repository contains tools for working with the [JSKOS data format for knowledge organization systems](http://gbv.github.io/jskos/).

## Install

```bash
npm i gbv/jskos-tools
```

Note: This installs the package from GitHub. We will publish this package to npm soon.

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
