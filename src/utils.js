export function isEqualWith(a, b, compare) {
  const pSlice = Array.prototype.slice
  const Object_keys = typeof Object.keys === "function"
    ? Object.keys
    : function (obj) {
      const keys = []
      for (const key in obj) {
        keys.push(key)
      }
      return keys
    }
  const deepEqual = function (actual, expected) {
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
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) {
      return false
    }
    if (a.prototype !== b.prototype) {
      return false
    }
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false
      }
      a = pSlice.call(a)
      b = pSlice.call(b)
      return deepEqual(a, b)
    }
    let ka, kb, key, i
    try {
      ka = Object_keys(a)
      kb = Object_keys(b)
    } catch (e) {
      return false
    }
    if (ka.length != kb.length) {
      return false
    }
    ka.sort()
    kb.sort()
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i]) {
        return false
      }
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
        if (!deepEqual(a[key], b[key])) {
          return false
        }
      }
    }
    return true
  }
  return deepEqual(a, b)
}

export function get(obj, path, defaultValue = undefined) {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}

export function pick(object, keys) {
  return keys.reduce((obj, key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (object && object.hasOwnProperty(key)) {
      obj[key] = object[key]
    }
    return obj
  }, {})
}

export function forOwn(object, cb) {
  for(let key in object){
    // eslint-disable-next-line no-prototype-builtins
    if (object.hasOwnProperty(key)){
      cb(object[key], key)
    }
  }
}

export function isObject(object) {
  return typeof object === "object" && object !== null
}

export function isString(str) {
  return (str && typeof str.valueOf() === "string") ? true : false
}

export function union(a, b) {
  return [...new Set([...a, ...b])]
}

export function unionWith(a, b, compare) {
  return [...a, ...b].reduce((p, c) => {
    if (p.findIndex(v => compare(v, c)) !== -1) {
      return p
    }
    p.push(c)
    return p
  }, [])
}

export function omitMod(obj, paths) {
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
}

/**
 * Sources:
 * - https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
 * - https://dustinpfister.github.io/2017/09/24/lodash_forown/
 * - https://stackoverflow.com/a/48666737/11050851
 * - https://github.com/stutrek/node-deep-equal/blob/master/index.js (heavily adapted to integrate isEqualWith)
 * - Own Implementation
 */
