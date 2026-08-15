import {
  isArray,
  isPlainObject,
  omitBy,
  mapValues,
  isUndefined,
} from 'lodash-es'

function deepRemoveUndefined(value) {
  if (isArray(value)) {
    return value.map(deepRemoveUndefined)
  }

  if (isPlainObject(value)) {
    return omitBy(mapValues(value, deepRemoveUndefined), isUndefined)
  }

  return value
}

export default deepRemoveUndefined
