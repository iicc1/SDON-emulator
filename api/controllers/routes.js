const deploy = require('../models/deploy')
const remove = require('../models/remove')

const router = app => {
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
}

module.exports = router
