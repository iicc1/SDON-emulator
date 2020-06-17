const util = require('util')
const exec = util.promisify(require('child_process').exec)

const createContainers = async (instances) => {
  await exec('docker-compose up -d --build --scale agent=' + instances)
}

const getContainers = async () => {
  const dockerPsStd = await exec('docker ps --format "{{.Names}}"')
  const containerIds = dockerPsStd.stdout.split('\n')
  const containerIdsFiltered = []
  for (const containerId of containerIds) {
    if (containerId.includes('sdn_optical_network_agent_')) {
      containerIdsFiltered.push(containerId)
    }
  }

  const containers = []
  for (const i in containerIdsFiltered) {
    const dockerInspectStd = await exec('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ' + containerIdsFiltered[i])
    // check
    containers[i] = {}
    containers[i].name = containerIdsFiltered[i]
    containers[i].ip = dockerInspectStd.stdout.replace('\n', '')
    containers[i].port = 830
  }
  console.log('containers', containers)
  return containers
}

const removeContainers = async (containers) => {
  // Containers must be removed in order ONOS to stop communicating with them
  for (const container of containers) {
    console.log('Removing ' + container.name)
    await exec('docker rm -f ' + container.name)
  }
}

module.exports = {
  createContainers, getContainers, removeContainers
}
