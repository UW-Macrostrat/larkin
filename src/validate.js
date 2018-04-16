const typeMapping = require('./type-mapping')
const parseDatatype = require('./util').parseDatatype

function validateRoute(route) {
  if (!route) {
    throw new Error('Route is null')
  }
  // Make sure a path is present and properly formatted
  if (!route.path) {
    throw new Error('A path is required for the route. For example, /things ')
  }
  if (route.path.substring(0, 1) != '/') {
    throw new Error('The path for a route must begin with a forward slash. For example, /things')
  }

  // Verify description
  if (!route.description || !route.description.length) {
    throw new Error(`The route "${route.path}" is missing a description`)
  }

  // Make sure parameters are present
  if (!route.parameters) {
    throw new Error(`The route "${route.path}" must have parameters`)
  }
  if (Object.keys(route.parameters).length === 0 ) {
    throw new Error(`The route "${route.path}" must have parameters`)
  }

  // Validate the parameters
  Object.keys(route.parameters).forEach(param => {
    if (!route.parameters[param].type) {
      throw new Error(`The parameter "${param}" is missing a type`)
    }
    if (!typeMapping[route.parameters[param].type]) {
      throw new Error(`The type "${route.parameters[param].type}" is invalid`)
    }
  })

  // Make sure fields are present
  if (!route.fields) {
    throw new Error(`The route ${route.path} must have a fields value`)
  }
  if (Object.keys(route.fields).length === 0 ) {
    throw new Error(`The route ${route.path} must have a fields value`)
  }

  // Validate each of the fields
  Object.keys(route.fields).forEach(field => {
    if (!route.fields[field].hasOwnProperty('type')) {
      throw new Error(`The field "${field}" is missing a type`)
    }
    if (!typeMapping[route.fields[field].type]) {
      throw new Error(`The field "${field}" does not have a valid type`)
    }

    if (!route.fields[field].hasOwnProperty('description') || route.fields[field].description.length === 0) {
      throw new Error(`The field "${field}" is missing a description`)
    }
  })

  // Make sure a handler exists
  if (!route.handler) {
    throw new Error(`The route ${route.path} must have a request handler`)
  }

  // Make sure a handler exists
  if (route.handler.length < 3) {
    throw new Error(`The handler of ${route.path} must accept three parameters - req, res, next, and optionally plugins`)
  }

  // Check for the existence of examples
  if (!route.examples || !route.examples.length) {
    throw new Error(`The route ${route.path} must have at least one example`)
  }
}

function validateQueryParameters(values, type, param) {
  if (values.indexOf(',') > -1 && type.indexOf('[]') === -1) {
    return `The parameter '${param}' does not accept comma-delimited lists of values`
  }
  if (type.indexOf('[]') > -1) {
    values = values.split(',')
    for (let i = 0; i < values.length; i++) {
      let error = validateDatatype(values[i], type, param)
      if (error) return error
    }
  } else {
    return validateDatatype(values, type, param)
  }
}

function validateDatatype(val, type, param) {
  let parsedValue = parseDatatype(val)
  if (typeof parsedValue != typeMapping[type]) {
    return `The value '${val}' provided to the parameter '${param}' is invalid. The parameter '${param}' expects values to be a ${typeMapping[type]} but '${val}' is a ${typeof parsedValue}`
  }
  return
}

module.exports = {
  'route': validateRoute,
  'queryParameters': validateQueryParameters,
  'dataType': validateDatatype
}
