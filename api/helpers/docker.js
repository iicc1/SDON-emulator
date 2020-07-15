const util = require('util')
const exec = util.promisify(require('child_process').exec)
require('dotenv')

const createContainers = async (instances) => {
  try {
    await exec('docker-compose up -d --build --scale agent=' + instances)
  } catch (error) {
    if (error.stderr.indexOf('Ports are not available')) {
      console.log('Warning: socket address not available, restarting. (This is a Windows bug)')
    } else {
      throw new Error(error.stderr)
    }
  }
}

const retryContainers = async () => {
  const dockerPsStd = await exec('docker ps --format "{{.Names}}" --filter "status=created"')
  const containerIds = dockerPsStd.stdout.split('\n')
  for (const containerId of containerIds) {
    if (containerId.includes('sdn_optical_network_agent_') || containerId.includes('sdnopticalnetwork_agent_')) {
      await exec('docker restart ' + containerId)
    }
  }
}

const getContainers = async () => {
  const dockerPsStd = await exec('docker ps --format "{{.Names}}"')
  const containerIds = dockerPsStd.stdout.split('\n')
  const containerIdsFiltered = []
  for (const containerId of containerIds) {
    if (containerId.includes('sdn_optical_network_agent_') || containerId.includes('sdnopticalnetwork_agent_')) {
      containerIdsFiltered.push(containerId)
    }
  }

  const containers = []
  for (const i in containerIdsFiltered) {
    // const dockerInspectStd = await exec('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ' + containerIdsFiltered[i])
    const dockerPortStd = await exec('docker port ' + containerIdsFiltered[i])
    containers[i] = {}
    containers[i].name = containerIdsFiltered[i]
    containers[i].ip = process.env.SERVER_IP // dockerInspectStd.stdout.replace('\n', '')
    containers[i].port = dockerPortStd.stdout.match(/:(\w+)/)[1] // 830
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
  createContainers, retryContainers, getContainers, removeContainers
}
