function parseDatatype(val) {
  try {
    return JSON.parse(val)
  } catch(e) {
    return val
  }
}

function parseParams(value, type) {
  if (type.indexOf('[]') > -1) {
    value = value.split(',')
    return value.map(v => { return parseDatatype(v) })
  } else {
    return parseDatatype(value)
  }
}

module.exports = {
  parseDatatype: parseDatatype,
  parseParams: parseParams
}
