const Router = require('express').Router

const typeMapping = {
  'text': 'string',
  'text[]': 'string',
  'integer': 'number',
  'integer[]': 'number',
  'boolean': 'boolean'
}


function parseDatatype(val) {
  try {
    return JSON.parse(val)
  } catch(e) {
    return val
  }
}

function validateDatatype(val, type, param) {
  let parsedValue = parseDatatype(val)
  if (typeof parsedValue != typeMapping[type]) {
    return `The value '${val}' provided to the parameter '${param}' is invalid. The parameter '${param}' expects values to be a ${typeMapping[type]} but '${val}' is a ${typeof parsedValue}`
  }
  return
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

module.exports = class Larkin {
  constructor(params) {
    // The Express router that is pluggable to a server instance
    this.router = Router()

    // Before the handler of any route is called validate the request
    this.router.use(this.validateRequest.bind(this))

    // Internal record of registered routes and their associated configs
    this.routes = {}
  }

  validateRequest(req, res, next) {
    // Make sure route exists (hijacks Express's attempt route resolution)
    let requestedRoute = req._parsedUrl.pathname
    if (!this.routes[requestedRoute]) {
      return this.error(req, res, next, 'Route not found', 404)
    }

    // Validate query parameters
    let queryParams = Object.keys(req.query)
    if (queryParams.length) {
      for (let i = 0; i < queryParams.length; i++) {
        // Does this parameter exist on the requested route?
        if (!this.routes[requestedRoute].parameters[queryParams[i]]) {
          return this.error(req, res, next, `The parameter '${queryParams[i]}' is not recognized for this route`, 400)
        }

        // Does the value for this parameter conform to the type definition?
        let type = this.routes[requestedRoute].parameters[queryParams[i]].type

        let validationError = validateQueryParameters(req.query[queryParams[i]], type, queryParams[i])
        if (validationError) {
          return this.error(req, res, next, validationError, 400)
        }

        // If the parameter being used is limited to certain values, validate
        if (this.routes[requestedRoute].parameters[queryParams[i]].values) {
          if (this.routes[requestedRoute].parameters[queryParams[i]].values.indexOf(parseDatatype(req.query[queryParams[i]])) === -1) {
            return this.error(req, res, next, `The parameter '${queryParams[i]}' accepts the following values -  ${this.routes[requestedRoute].parameters[queryParams[i]].values.join(', ')}. The value '${req.query[queryParams[i]]}' is invalid and not recognized.`)
          }
        }
      }

    }
    next()
  }

  // Given a larkin route definition file register the route on the API
  registerRoute(route) {
    // Wire the route up to Express
    this.router.route(route.path)
      .get(route.handler)

    // Keep track of it internally for validation
    this.routes[route.path] = route
  }

  send(req, res, next, data, params) {

  }

  error(req, res, next, message, code) {
    message = message || 'An error occurred'

    res.status = code || 500
    res.json({
      'error': message
    })
  }
}

//module.exports = {
