const deploy = require('../models/deploy')
const remove = require('../models/remove')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./../swagger')

const router = app => {
  // Checks that the API works
  app.get('/test', async (request, response) => {
    response.send({ success: true })
  })

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  // Deploys an Optical topology in an emulated environment with ONOS as the SDN controller
  app.get('/deploy/:topologyType/:topologyName', async (request, response) => {
    const reply = {}
    try {
      reply.success = true
      reply.result = await deploy(request.params.topologyType, request.params.topologyName)
    } catch (error) {
      console.log(error)
      reply.success = false
      reply.message = error.message
    }
    response.send(reply)
  })

  // Removes Docker containers and/or ONOS topology data
  app.get('/remove/:option', async (request, response) => {
    const reply = {}
    try {
      reply.success = true
      reply.result = await remove(request.params.option)
    } catch (error) {
      console.log(error)
      reply.success = false
      reply.message = error.message
    }
    response.send(reply)
  })

  // Route called from callbacks generated inside the containers.
  // TODO add middleware that translates ip to device
  app.post('/callback/', async (request, response) => {
    const reply = {}
    try {
      reply.success = true
      console.log('Callback received')
      // console.log('Docker host:', request.connection.remoteAddress)
      console.log('Notification:', request.body.notification)
      console.log('Changes:', request.body.changes)
      // console.log('current', request.body.current)
    } catch (error) {
      console.log(error)
      reply.success = false
      reply.message = error.message
    }
    response.send(reply)
  })
}

module.exports = router
