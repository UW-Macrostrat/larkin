module.exports = {
  path: '/foo',
  description: 'An example route',
  parameters: {
    'thing': {
      'type': 'text[]'
    },
    'format': {
      'type': 'text',
      'values': [ 'json', 'csv' ]
    }
  },
  requiredParameters: [ ],
  requiresOneOf: [ 'thing' ],
  fields: {
    'message': {
      'type': 'text',
      'description': 'A message'
    }
  },
  examples: [
    '/api/foo'
  ],
  handler: (req, res, next) => {
    res.reply(req, res, next, [{"message": `Can you hear me? You provided the following values to the parameter 'thing' - ${req.query.thing.join(', ')}`}])
  }
}
