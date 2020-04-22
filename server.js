import express from 'express'
import { json, urlencoded } from 'body-parser'
import routes from './api/routes'
const app = express()

// Use Node.js body parsing middleware
app.use(json())
app.use(urlencoded({
  extended: true
}))

routes(app)

// Start the server on port 7000
app.listen(7000, function () {
  console.log('Listening on port ' + 7000)
})
