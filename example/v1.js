const Larkin = require('../src/larkin')
const fs = require('fs')

// Define a new larkin instance
let v1 = new Larkin({
  version: 1,
  license: 'MIT'
})

// Recursively read all the route definition files in the folder /routes and register them
fs.readdirSync(`${__dirname}/routes`).forEach(file => {
  // Make sure we don't accidentally read something like .DS_Store
  if (file.split('.').pop() === 'js') {
    v1.registerRoute(require(`./routes/${file}`))
  }
})

module.exports = v1
