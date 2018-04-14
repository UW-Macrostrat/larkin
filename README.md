# Larkin  
Expedited API authoring. Provides parameter validation, response handling, and route documentation generation.

## Install  

**NOT YET PUBLISHED!**
````
npm install --save @macrostrat/larkin
````

## Usage  
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
Optional configuration object that can contain a `version` for the API and a `license`

### .registerRoute(routeHandler)
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

### .validateRequest(req, res, next)
An internal middleware method that is called on every request. Validates the following:
+ The existence of the requested route
+ Returning route definitions if the bare route is requested
+ Checks for the existence of all provided query parameters. An error will be returned if an unknown query parameter is passed.
+ Validates the data type of the values provided to each query parameter
+ If a given query parameter only accepts certain values as defined in the route definition, the value passed to that parameter will be validated against the accepted values.



## Funding  
Development supported by NSF CAREER EAR-1150082 and NSF ICER-1440312.

## License  
MIT