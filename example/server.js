const express = require('express')
const app = express()
const v1 = require('./v1')

// Map our larkin router to the uri /api/v1 and /api
app.use('/api/v1', v1.router)
app.use('/api', v1.router)

// Run on port 5500, unless an arg is passed (i.e. `node server.js 5555`)
app.port = process.argv[2] || 5500

app.start = () => {
  app.listen(app.port, function() {
    console.log(`Listening on port ${app.port}`)
  })
}

if (!module.parent) {
  app.start()
}

module.exports = app
