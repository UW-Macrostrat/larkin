module.exports = {
  // The uri this route is mapped to
  path: '/:name',

  displayPath: '/:name',

  // Describe what the route does here
  description: 'Description goes here',

  // List any required parameters here (ex: [ 'foo' ])
  requiredParameters: [],

  // Often times at least one parameter is required. List those here
  requiresOneOf: [ 'example' ],

  // All the parameters that can be used to query this route
  parameters: {
    // Parameters can be of type text, text[], integer, integer[], or boolean
    'example': {
      'type': 'text[]',
      'description': 'An example of a parameter'
    },
    'format': {
      'type': 'text',
      'description': 'Desired output format',
      'values': [ 'json', 'csv' ]
    }
  },

  // The fields contained by each object in the output. Must have a 'type' and 'description'
  fields: {
    'message': {
      'type': 'text',
      'description': 'Returns success'
    }
  },

  // Add additional examples here
  examples: [
    '/api/:name?example=bar,baz'
  ],

  // The ExpressJS handler
  handler: (req, res, next, plugins) => {
    res.reply(req, res, next, [{
      'message': 'success'
    }])
  }
}
