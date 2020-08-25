function isEqualWith(a, b, compare) {
  var pSlice = Array.prototype.slice
  var Object_keys = typeof Object.keys === "function"
    ? Object.keys
    : function (obj) {
      var keys = []
      for (var key in obj) keys.push(key)
      return keys
    }
  var deepEqual = function (actual, expected) {
    if (actual === expected) {
      return true
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime()
    } else if (typeof actual != "object" && typeof expected != "object") {
      return actual == expected
    } else {
      return objEquiv(actual, expected)
    }
  }
  function isUndefinedOrNull(value) {
    return value === null || value === undefined
  }
  function isArguments(object) {
    return Object.prototype.toString.call(object) == "[object Arguments]"
  }
  function objEquiv(a, b) {
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
      return false
    if (a.prototype !== b.prototype) return false
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false
      }
      a = pSlice.call(a)
      b = pSlice.call(b)
      return deepEqual(a, b)
    }
    try {
      var ka = Object_keys(a),
        kb = Object_keys(b),
        key, i
    } catch (e) {
      return false
    }
    if (ka.length != kb.length)
      return false
    ka.sort()
    kb.sort()
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i])
        return false
    }
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i]
      if (compare) {
        let result = compare(a[key], b[key], key)
        if (result === undefined) {
          // fallback to method without comparison
          result = isEqualWith(a[key], b[key])
        }
        if (!result) {
          return false
        }
      } else {
        if (!deepEqual(a[key], b[key])) return false
      }
    }
    return true
  }
  return deepEqual(a, b)
}

module.exports = {
  get: (obj, path, defaultValue = undefined) => {
    const travel = regexp =>
      String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
    const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
    return result === undefined || result === obj ? defaultValue : result
  },
  pick: (object, keys) => {
    return keys.reduce((obj, key) => {
      // eslint-disable-next-line no-prototype-builtins
      if (object && object.hasOwnProperty(key)) {
        obj[key] = object[key]
      }
      return obj
    }, {})
  },
  forOwn: (object, cb) => {
    for(let key in object){
      // eslint-disable-next-line no-prototype-builtins
      if (object.hasOwnProperty(key)){
        cb(object[key], key)
      }
    }
  },
  isEqual: (a, b) => isEqualWith(a, b),
  isEqualWith,
  intersection: (...arrays) => arrays.reduce((a, b) => a.filter(c => b.includes(c))),
  isArray: Array.isArray,
  isObject: object => typeof object === "object" && object !== null,
  isString: (str) => (str && typeof str.valueOf() === "string") ? true : false,
  union: (a, b) => [...new Set([...a, ...b])],
  unionWith: (a, b, compare) => [...a, ...b].reduce((p, c) => {
    if (p.findIndex(v => compare(v, c)) !== -1) {
      return p
    }
    p.push(c)
    return p
  }, []),
  omitMod: (obj, paths) => {
    for (let path of paths) {
      if (typeof path === "string") {
        path = path.split(".")
      }
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]]
        if (typeof obj === "undefined") {
          continue
        }
      }
      delete obj[path.pop()]
    }
  },
}

/**
 * Sources:
 * - https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
 * - https://dustinpfister.github.io/2017/09/24/lodash_forown/
 * - https://stackoverflow.com/a/48666737/11050851
 * - https://github.com/stutrek/node-deep-equal/blob/master/index.js (heavily adapted to integrate isEqualWith)
 * - Own Implementation
 */
