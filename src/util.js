function parseDatatype(val) {
  try {
    return JSON.parse(val)
  } catch(e) {
    return val
  }
}

module.exports = {
  parseDatatype: parseDatatype
}
