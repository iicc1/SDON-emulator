const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./api/routes')
const app = express()

// Use Node.js body parsing middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

routes(app)

// Start the server
app.listen(7000, function () {
  console.log('Listening on port ' + 7000)
})
