const Router = require('express').Router
const csv = require('csv-express')
const dbgeo = require('dbgeo').parse

const typeMapping = require('./type-mapping')

const util = require('./util')
const validate = require('./validate')


module.exports = class Larkin {
  constructor(config) {
    this.version = (config && config.version) ? config.version : 1
    this.license = (config && config.license) ? config.license : 'Unknown'
    this.description = (config && config.description) ? config.description : 'This is the API root'
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

    // If the root of the API is requested return a list of available routes
    if (requestedRoute === '/') {
      let routes = {}
      Object.keys(this.routes).forEach(route => {
        routes[this.routes[route].path] = this.routes[route].description
      })
      return res.json({
        'v': this.version,
        'license': this.license,
        'description': this.description,
        'routes': routes
      })
    }

    if (!this.routes[requestedRoute]) {
      return this._error(req, res, next, 'Route not found', 404)
    }

    // Get query parameters
    let queryParams = Object.keys(req.query)

    // If no parameters or query is provided return the route definition
    if (!queryParams.length) {
      return res.json({
        'v': this.version,
        'license': this.license,
        'route': this.routes[requestedRoute].path,
        'description': this.routes[requestedRoute].description,
        'parameters': this.routes[requestedRoute].parameters,
        'fields': this.routes[requestedRoute].fields,
        'examples': this.routes[requestedRoute].examples
      })
    }

    // Validate query parameters
    if (queryParams.length) {
      for (let i = 0; i < queryParams.length; i++) {
        // Does this parameter exist on the requested route?
        if (!this.routes[requestedRoute].parameters[queryParams[i]]) {
          return this._error(req, res, next, `The parameter '${queryParams[i]}' is not recognized for this route`, 400)
        }

        // Does the value for this parameter conform to the type definition?
        let type = this.routes[requestedRoute].parameters[queryParams[i]].type

        let validationError = validate.queryParameters(req.query[queryParams[i]], type, queryParams[i])
        if (validationError) {
          return this._error(req, res, next, validationError, 400)
        }

        // If the parameter being used is limited to certain values, validate
        if (this.routes[requestedRoute].parameters[queryParams[i]].values) {
          if (this.routes[requestedRoute].parameters[queryParams[i]].values.indexOf(util.parseDatatype(req.query[queryParams[i]])) === -1) {
            return this._error(req, res, next, `The parameter '${queryParams[i]}' accepts the following values -  ${this.routes[requestedRoute].parameters[queryParams[i]].values.join(', ')}. The value '${req.query[queryParams[i]]}' is invalid and not recognized.`, 400)
          }
        }
      }

    }
    //next()
    this.routes[requestedRoute].handler(req, res, next)
  }

  // Given a larkin route definition file register the route on the API
  registerRoute(route) {
    // Before wiring up validate
    validate.route(route)
    // Wire the route up to Express
    this.router.route(route.path)
      .get((req, res, next) => {
        // Add custom response methods that routes will use
        res.reply = this._send
        res.error = this._error
        return route.handler(req, res, next)
      })

    // Keep track of it internally for validation
    this.routes[route.path] = route
  }

  _send(req, res, next, data, params) {
    let format = req.query.format || 'json'
    switch (format) {
      case 'csv':
        return res.csv(data, true)
        break

      case 'geojson':
        dbgeo(data, {
          'format': 'geojson',
          'precision': 6
        }, (error, geojson) => {
          if (error) {
            return this._error(req, res, next, 'An internal error occurred', 500)
          }
          res.json(geojson)
        })
        break

      case 'topojson':
        dbgeo(data, {
          'format': 'topojson',
          'precision': 6
        }, (error, topojson) => {
          if (error) {
            return this._error(req, res, next, 'An internal error occurred', 500)
          }
          res.json(topojson)
        })
        break

      default:
        res.json({
          'v': this.version,
          'license': this.license,
          'data': data
        })
    }
  }

  _error(req, res, next, message, code) {
    message = message || 'An error occurred'

    res.status = code || 500
    res.json({
      'error': message
    })
  }
}
