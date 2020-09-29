require('dotenv')
const fs = require('fs').promises
const utils = require('../helpers/utils')
const Net2PlanParser = require('../helpers/Net2PlanParser')
const docker = require('../helpers/docker')
const onos = require('../helpers/onos')

const deploy = async (topologyType, topologyName) => {
  let topology, nodeNumber, linkNumber
  if (topologyType === 'net2plan') {
    // Extracts the basic data from the Net2Plan topology
    ({ topology, nodeNumber, linkNumber } = await Net2PlanParser.topologyParser(topologyName))
  } else {
    // Only Net2Plan topologies are supported
    throw new Error('Topology type ' + topologyType + ' not supported.')
  }

  console.log('Deploying ' + topologyName + ' which has ' + nodeNumber + ' nodes and ' + linkNumber + ' links')

  // Creates the required containers and builds the ONOS network data
  await docker.createContainers(nodeNumber)
  await docker.retryContainers()
  const containers = await docker.getContainers()
  const { devices, devicesById } = createDevices(containers, topology)
  const links = createLinks(devicesById, topology)

  // ONOS network configuration
  const networkConfiguration = {
    devices: devices,
    links: links,
    hosts: {},
    apps: {},
    ports: {},
    regions: {},
    layouts: {}
  }

  // Saves the ONOS network configuration to the disk
  await fs.writeFile('./topologies/ONOS/networkConfiguration.json', JSON.stringify(networkConfiguration, null, '\t'))
  console.log('Network configuration saved as networkConfiguration.json')

  // Removes the previous topology
  await onos.removeONOSTopology()
  // Deploys the new topology with some delay, so all the containers are ready
  setTimeout(() => onos.deployONOSTopology(networkConfiguration), 60000)

  // Returns the ONOS network configuration to the API controller to display it to the user
  return networkConfiguration
}

// Creates the ONOS device object and an auxiliar object to build the links object
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

// Creates the ONOS links object by the topology and the auxiliar object
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

if (process.argv[2]) {
  deploy(process.argv[2])
}

module.exports = deploy
