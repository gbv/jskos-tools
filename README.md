# JSKOS JSON Schemas

[![Build Status](https://travis-ci.com/gbv/jskos-json-schemas.svg?branch=master)](https://travis-ci.com/gbv/jskos-json-schemas)

> JSON Schemas and tests for the JSKOS data format.

This repository contains [JSON Schemas](http://json-schema.org) and tests for the [JSKOS data format for knowledge organization systems](http://gbv.github.io/jskos/).

Note that currently all of the schemas are incomplete or non-existent.

## Install

```bash
npm i jskos-json-schemas
```

## Usage

```javascript
const { validate } = require("jskos-json-schemas")

let concept = {
  ...
}

validate.concept(concept) // returns true or false
```

## Build

```bash
git clone --recursive https://github.com/gbv/jskos-json-schemas.git
cd jskos-json-schemas/
npm install
```

## Test

```bash
npm test
```
