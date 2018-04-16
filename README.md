# Larkin  
Expedited API authoring with Express

## Features
+ Run-time route validation
+ Request query validation
+ Simplified response handling in a variety of formats, including JSON, CSV, and GeoJSON
+ Route documentation generation


## Install  

**NOT YET PUBLISHED!**
````
npm install --save @macrostrat/larkin
````

## Usage  
For a complete example please see the code in `/example`

````javascript
const express = require('express')
const app = express()
const Larkin = require('larkin')

let v1 = new Larkin()
// register routes

app.use('/api', v1.router)

app.listen(5555, function() {
  console.log('Listening on port 5555')
})
````

## API

### `Larkin(config)`  
Initializes a new Larkin instance.

##### config
Contains the following optional parameters:
+ `version` - the API version. Default is `1`
+ `license` - The license applied to responses from the API. Default is `Unknown`
+ `description` - a description of the API that is returned when the root of the API is requested

### `.registerRoute(routeHandler)`
Registers an API route with Larkin. The `routeHandler` is a normal ExpressJS routing function that has a `request`, `response`, and `next` methods. However, when a route is registered with Larkin two additional methods are added to the `response` object - `reply` and `error`.  
`reply` is a function for returning data to the client that accepts 5 parameters:
+ `request`
+ `response`
+ `next`
+ `data` - an array of objects to be returned to the client
+ `params` - optional options to pass to the response

`error` is a function for returning errors to the client in the event an error occurs during the processing of the request. It takes the following parameters:  
+ `request`
+ `response`
+ `next`
+ `error` - a message to return to the client
+ `error code` - defaults to `500`. The appropriate error code for the HTTP response.

### `.registerPlugin(pluginName, plugin) `
Larkin provides a convenient way to share code between all routes by using plugins. If your API is database-driven, a plugin in a great way to define a database connection pool once and use it in all your routes. The plugin can have an API of your choosing.

+ `pluginName` - a string that defines the key for referencing a plugin
+ `plugin` - an object that contains methods

````
larkin.registerPlugin('postgres', {
  query: (sql, params, callback) { ... }
})

````

### .validateRequest(req, res, next)
An internal middleware method that is called on every request. Validates the following:
+ The existence of the requested route
+ Returning route definitions if the bare route is requested
+ Checks for the existence of all provided query parameters. An error will be returned if an unknown query parameter is passed.
+ Validates the data type of the values provided to each query parameter
+ If a given query parameter only accepts certain values as defined in the route definition, the value passed to that parameter will be validated against the accepted values.



## Development  
Larkin uses Tape for tests, which can be found in `/test`. To run unit tests:

````
npm test
````

## Funding  
Development supported by NSF CAREER EAR-1150082 and NSF ICER-1440312.

## License  
MIT
