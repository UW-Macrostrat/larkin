const test = require('tape')
const Larkin = require('../src/larkin')
const routeMock = require('./route.mock')

let larkinMock = new Larkin({
  version: 1,
  license: 'MIT'
})

test('contains a license and version', t => {
  t.plan(2)

  t.equal(larkinMock.version, 1)
  t.equal(larkinMock.license, 'MIT')
  t.end()
})


test('register a route', t => {
  larkinMock.registerRoute(routeMock)
  // Make sure res has custom reply and error methods
  // make sure larkinMock.routes inherits the route
  t.deepEqual(larkinMock.routes[routeMock.path], routeMock)
  t.end()
})

test('register a plugin', t => {
  let mockPlugin = {
    'someMethod': () => {}
  }
  larkinMock.registerPlugin('testPlugin', mockPlugin)

  t.deepEqual(larkinMock.plugins, {
    'testPlugin': mockPlugin
  })

  t.end()
})


test('throw an error if an unknown route is requested', t => {
  let req = {
    _parsedUrl: {
      pathname: '/invalid'
    }
  }
  let res = {
    status: 0,
    json: (obj) => {
      t.equal(obj.error, 'Route not found')
      t.equal(res.status, 404)
      t.end()
    }
  }
  larkinMock.validateRequest(req, res)
})


test('return the route definition if no parameters are passed', t => {

  let req = {
    _parsedUrl: {
      pathname: routeMock.path
    },
    query: {}
  }
  let res = {
    json: (obj) => {
      t.deepEqual(obj, {
        'v': larkinMock.version,
        'license': larkinMock.license,
        'route': routeMock.path,
        'description': routeMock.description,
        'parameters': routeMock.parameters,
        'fields': routeMock.fields,
        'examples': routeMock.examples
      })
      t.end()
    }
  }
  larkinMock.validateRequest(req, res)
})


test('throw an error if an unknown parameter is passed', t => {
  let req = {
    _parsedUrl: {
      pathname: routeMock.path
    },
    query: {
      'invalid': 'abc'
    }
  }
  let res = {
    status: 0,
    json: (obj) => {
      t.deepEqual(obj, {
        'error': `The parameter 'invalid' is not recognized for this route`
      })
      t.equal(res.status, 400)
      t.end()
    }
  }
  larkinMock.validateRequest(req, res)
})


test('throw an error if an invalid data type is passed to a known parameter', t => {
  let req = {
    _parsedUrl: {
      pathname: routeMock.path
    },
    query: {
      'booker': '99'
    }
  }
  let res = {
    status: 0,
    json: (obj) => {
      t.deepEqual(obj, {
        'error': `The value '99' provided to the parameter 'booker' is invalid. The parameter 'booker' expects values to be a string but '99' is a number`
      })
      t.equal(res.status, 400)
      t.end()
    }
  }
  larkinMock.validateRequest(req, res)
})


test('allow valid values passed to a known parameter', t => {
  let req = {
    'url': routeMock.path,
    'method': 'GET',
    _parsedUrl: {
      pathname: routeMock.path
    },
    query: {
      'booker': 'cute'
    }
  }
  let res = {
    status: 0,
    reply: larkinMock._send.bind(larkinMock),
    json: (obj) => {
      t.deepEqual(obj.data, [{
          "message": "success"
        }]
      )
      t.end()
    }
  }
  larkinMock.router.handle(req, res, function(error) {
    console.log('ERROR', error)
  })
})


test('throw an error if an unknown value is passed to a known parameter with enumerated values', t => {
  let req = {
    _parsedUrl: {
      pathname: routeMock.path
    },
    query: {
      'format': 'invalid'
    }
  }
  let res = {
    status: 0,
    json: (obj) => {
      t.deepEqual(obj, {
        'error': `The parameter 'format' accepts the following values -  ${routeMock.parameters.format.values.join(', ')}. The value 'invalid' is invalid and not recognized.`
      })
      t.equal(res.status, 400)
      t.end()
    }
  }
  larkinMock.validateRequest(req, res)
})


test('allow a valid value passed to a known parameter with enumerated values', t => {
  let req = {
    'url': routeMock.path,
    'method': 'GET',
    _parsedUrl: {
      pathname: routeMock.path
    },
    query: {
      'format': 'json'
    }
  }
  let res = {
    status: 0,
    reply: larkinMock._send.bind(larkinMock),
    json: (obj) => {
      t.deepEqual(obj.data,[{
          "message": "success"
        }]
      )
      t.end()
    }
  }
  larkinMock.router.handle(req, res, function(error) {
    console.log('ERROR', error)
  })
})
