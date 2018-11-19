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
  //  this.router.use(this.validateRequest.bind(this))

    // Internal record of registered routes and their associated configs
    this.routes = {}

    // Plugins can be arbitrarily defined by the user
    this.plugins = {}

    this.router.get('/', this.validateRequest.bind(this))
  }

  validateRequest(req, res, next) {
    // Make sure route exists (hijacks Express's attempt route resolution)
  //  let requestedRoute = req._parsedUrl.pathname
    let requestedRoute = req.route.path
    
    // If the root of the API is requested return a list of available routes
    if (!requestedRoute || requestedRoute === '/') {
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

    // If the requested route is unknown to larkin, return a 404
    if (!this.routes[requestedRoute]) {
      return this._error(req, res, next, 'Route not found', 404)
    }

    // Get query parameters
    let queryParams = Object.keys(req.query).map(d => { return [d, req.query[d]] })
    let positionalParams = (req.params) ? Object.keys(req.params).filter(d => { if (req.params[d]) return d }).map(d => { return [d, req.params[d]] }) : []
    // Combine them
    queryParams = [...queryParams, ...positionalParams]


    // If no parameters or query is provided return the route definition
    if (!queryParams.length) {
      return res.json({
        'v': this.version,
        'license': this.license,
        'route': this.routes[requestedRoute].path,
        'methods': this.routes[requestedRoute].methods,
        'description': this.routes[requestedRoute].description,
        'requiredParameters': this.routes[requestedRoute].requiredParameters,
        'requiresOneOf': this.routes[requestedRoute].requiresOneOf,
        'parameters': this.routes[requestedRoute].parameters,
        'fields': this.routes[requestedRoute].fields,
        'examples': this.routes[requestedRoute].examples
      })
    }

    // Validate query parameters
    for (let i = 0; i < queryParams.length; i++) {
      // Does this parameter exist on the requested route?
      if (!this.routes[requestedRoute].parameters[queryParams[i][0]]) {
        return this._error(req, res, next, `The parameter '${queryParams[i][0]}' is not recognized for this route`, 400)
      }

      // Does the value for this parameter conform to the type definition?
      let type = this.routes[requestedRoute].parameters[queryParams[i][0]].type

      let validationError = validate.queryParameters(queryParams[i][1], type, queryParams[i][0])
      if (validationError) {
        return this._error(req, res, next, validationError, 400)
      }

      // If the parameter being used is limited to certain values, validate
      if (this.routes[requestedRoute].parameters[queryParams[i][0]].values) {
        let invalidValues = []
        let requestedValues = [].concat(util.parseParams(queryParams[i][1], this.routes[requestedRoute].parameters[queryParams[i][0]].type))

        requestedValues.forEach(v => {
          if (this.routes[requestedRoute].parameters[queryParams[i][0]].values.indexOf(v) === -1) {
            invalidValues.push(v)
          }
        })
        if (invalidValues.length) {
          return this._error(req, res, next, `The parameter '${queryParams[i][0]}' accepts the following values -  ${this.routes[requestedRoute].parameters[queryParams[i][0]].values.join(', ')}. The values '${invalidValues.join(', ')}' are invalid and not recognized.`, 400)
        }
      }

      // Parse the values
      req.query[queryParams[i][0]] = util.parseParams(queryParams[i][1], this.routes[requestedRoute].parameters[queryParams[i][0]].type)
    }

    // If the route has required parameters make sure they are present
    if (
      this.routes[requestedRoute].requiredParameters &&
      this.routes[requestedRoute].requiredParameters.length &&
      this.routes[requestedRoute].requiredParameters.filter(n => {
          return queryParams.indexOf(n) !== -1;
      }).length === 0
    ) {
      return this._error(req, res, next, `The route ${requestedRoute} requires the following parameters: ${this.routes[requestedRoute].requiredParameters.join(', ')}`, 400)
    }

    // If the route has requiresOneOf parameters make sure they are present
    if (
      this.routes[requestedRoute].requiresOneOf &&
      this.routes[requestedRoute].requiresOneOf.length &&
      this.routes[requestedRoute].requiresOneOf.filter(n => {
          return queryParams.map(d => d[0]).indexOf(n) !== -1;
      }).length === 0
    ) {
      return this._error(req, res, next, `The route ${requestedRoute} requires at least one of the following parameters: ${this.routes[requestedRoute].requiresOneOf.join(', ')}`, 400)
    }

    next()
  }

  // Given a larkin route definition file register the route on the API
  registerRoute(route) {
    // Validate before wiring up
    validate.route(route)

    this.router.route(route.path)
      .all(this.validateRequest.bind(this))

    // Wire the route up to Express
    route.methods.forEach(method => {
      if (method === 'GET') {
        this.router.route(route.path)
          .get((req, res, next) => {
            // Add custom response methods that routes will use
            res.reply = this._send.bind(this)
            res.error = this._error.bind(this)
            return route.handler(req, res, next, this.plugins)
          })
      } else if (method === 'POST') {
        this.router.route(route.path)
          .post((req, res, next) => {
            // Add custom response methods that routes will use
            res.reply = this._send.bind(this)
            res.error = this._error.bind(this)
            return route.handler(req, res, next, this.plugins)
          })
      } else if (method === 'PUT') {
        this.router.route(route.path)
          .put((req, res, next) => {
            // Add custom response methods that routes will use
            res.reply = this._send.bind(this)
            res.error = this._error.bind(this)
            return route.handler(req, res, next, this.plugins)
          })
      } else if (method === 'DELETE') {
        this.router.route(route.path)
          .delete((req, res, next) => {
            // Add custom response methods that routes will use
            res.reply = this._send.bind(this)
            res.error = this._error.bind(this)
            return route.handler(req, res, next, this.plugins)
          })
      } else {
        throw new Error(`Method ${method} is not valid HTTP method`)
      }
    })

    // Keep track of it internally for validation
    this.routes[route.path] = route
  }

  // Add a custom plugin that is accessible to all routes
  registerPlugin(pluginName, plugin) {
    if (!pluginName) {
      throw new Error('Plugin must have a name')
    }
    this.plugins[pluginName] = plugin
  }

  // Return data to the client
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
