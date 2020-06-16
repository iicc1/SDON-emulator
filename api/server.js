const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./controllers/routes')
const app = express()

// Use Node.js body parsing middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

routes(app)
console.log(__dirname)
// Start the server
app.listen(process.env.API_SERVER_PORT, () => {
  console.log('Listening on port ' + process.env.API_SERVER_PORT)
})
