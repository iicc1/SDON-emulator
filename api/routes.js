import deploy from '../deploy'

const router = app => {
  app.get('/deploy/:instances_num', async (request, response) => {
    const instancesNum = request.params.instances_num
    const result = await deploy(instancesNum)
    const reply = {}
    reply.success = true
    reply.data = result
    response.send(reply)
  })
}

export default router
