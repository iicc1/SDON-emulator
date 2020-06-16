require('dotenv')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs').promises
const fetch = require('node-fetch')
const utils = require('../helpers/utils')
const Net2PlanParser = require('../helpers/Net2PlanParser')

const deploy = async (topologyType, topologyName) => {
  // TODO check if num containers created === nodesnumber
  // const previous_containers = await getContainers()
  // await deleteContainers(previous_containers)
  let topology, nodeNumber, linkNumber
  if (topologyType === 'net2plan') {
    ({ topology, nodeNumber, linkNumber } = await Net2PlanParser.topologyParser(topologyName))
  } else {
    throw new Error('Topology type ' + topologyType + ' not supported.')
  }

  console.log('Deploying ' + topologyName + ' which has ' + nodeNumber + ' nodes and ' + linkNumber + ' links')

  await createContainers(nodeNumber)

  const containers = await getContainers()

  const { devices, devicesById } = createDevices(containers, topology)
  const links = createLinks(devicesById, topology)

  const networkConfiguration = {
    devices: devices,
    links: links
  }

  await fs.writeFile('./topologies/ONOS/networkConfiguration.json', JSON.stringify(networkConfiguration, null, '\t'))
  console.log('Network configuration saved as networkConfiguration.json')

  console.log(await deleteOnosNetwork())
  console.log(await deployOnosNetwork(networkConfiguration))
  await utils.sleep(60000)
  console.log(await deployOnosNetwork(networkConfiguration))
  /*
    {
        "devices": {},
        "links": {},
        "hosts": {},
        "apps": {},
        "ports": {},
        "regions": {},
        "layouts": {}
      }
  */

  return devices
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
    containers[i].name = containerIds[i]
    containers[i].ip = dockerInspectStd.stdout.replace('\n', '')
    containers[i].port = 830
  }
  console.log(containers)
  return containers
}

/*
async function deleteContainers (containers) {
  // Containers must be removed, otherwise ONOS will continue to connect to them
  for (const container of containers) {
    console.log(container.name)
    await exec('docker rm -f ' + container.name)
  }
}
*/

const createContainers = async (n) => {
  await exec('docker-compose up -d --build --scale agent=' + n)
}

const createDevices = (containers, topology) => {
  const devices = {}
  const devicesById = []
  for (const i in containers) {
    devices['netconf:' + containers[i].ip + ':' + containers[i].port] = {
      basic: {
        name: topology.nodes[i].name,
        driver: 'cassini-openconfig',
        locType: 'geo',
        latitude: topology.nodes[i].latitude,
        longitude: topology.nodes[i].longitude
      },
      netconf: {
        ip: containers[i].ip,
        port: containers[i].port,
        username: 'root',
        password: 'root',
        'idle-timeout': 0
      }
    }
    devicesById.push({ id: topology.nodes[i].id, device: 'netconf:' + containers[i].ip + ':' + containers[i].port })
  }
  return { devices, devicesById }
}

const createLinks = (devicesById, topology) => {
  const links = {}
  for (const link of topology.links) {
    const originNodeId = link.originId
    const destinationNodeId = link.destinationId
    const originNode = devicesById.find(x => x.id === originNodeId)
    const destinationNode = devicesById.find(x => x.id === destinationNodeId)

    links[originNode.device + '/' + utils.randomBetween(200, 232) + '-' + destinationNode.device + '/' + utils.randomBetween(200, 232)] = {
      basic: {
        type: 'OPTICAL',
        metric: '1',
        durable: true,
        bidirectional: true
      }
    }
  }
  return links
}

const deleteOnosNetwork = async () => {
  // ONOS network configuration must be cleared as well
  return fetch(process.env.ONOS_API_ENDPOINT + '/onos/v1/network/configuration', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      Authorization: 'Basic ' + Buffer.from(process.env.ONOS_API_USER + ':' + process.env.ONOS_API_PASSWORD).toString('base64')
    }
  })
    .then((response) => {
      if (response.ok) {
        return response
      } else {
        throw new Error('Response code: ' + response.status + '\nResponse error: ' + response.statusText)
      }
    })
    .then(async () => {
      return {
        success: true
      }
    })
    .catch((error) => {
      return {
        success: false,
        message: error.message
      }
    })
}

const deployOnosNetwork = async (networkConfiguration) => {
  return fetch(process.env.ONOS_API_ENDPOINT + '/onos/v1/network/configuration', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(process.env.ONOS_API_USER + ':' + process.env.ONOS_API_PASSWORD).toString('base64')
    },
    body: JSON.stringify(networkConfiguration, null, '\t')
  })
    .then((response) => {
      if (response.ok) {
        return response
      } else {
        throw new Error('Response code: ' + response.status + '\nResponse error: ' + response.statusText)
      }
    })
    .then(async () => {
      return {
        success: true
      }
    })
    .catch((error) => {
      return {
        success: false,
        message: error.message
      }
    })
}

if (process.argv[2]) {
  deploy(process.argv[2])
}

module.exports = deploy
