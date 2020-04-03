const deploy = require('../deploy')

const router = app => {
	app.get('/deploy/:instances_num', async (request, response) => {
        const instances_num = request.params.instances_num
		let result = await deploy(instances_num) 
        let reply = {}
        reply.success = true
        reply.data = result
        response.send(reply);
    });
}

module.exports = router;
