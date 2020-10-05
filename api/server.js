const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./controllers/routes')
const app = express()

// Use Node.js body parsing middleware
app.use(bodyParser.json({
  limit: '50mb'
}))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}))

routes(app)
// Start the server
app.listen(process.env.API_SERVER_PORT, () => {
  console.log('Server listening on port ' + process.env.API_SERVER_PORT)
})
