require('dotenv')
const fs = require('fs').promises
const utils = require('../helpers/utils')
const Net2PlanParser = require('../helpers/Net2PlanParser')
const docker = require('../helpers/docker')
const onos = require('../helpers/onos')

const deploy = async (topologyType, topologyName) => {
  // TODO check if num containers created === nodesnumber
  let topology, nodeNumber, linkNumber
  if (topologyType === 'net2plan') {
    ({ topology, nodeNumber, linkNumber } = await Net2PlanParser.topologyParser(topologyName))
  } else {
    throw new Error('Topology type ' + topologyType + ' not supported.')
  }

  console.log('Deploying ' + topologyName + ' which has ' + nodeNumber + ' nodes and ' + linkNumber + ' links')

  await docker.createContainers(nodeNumber)
  await docker.retryContainers()
  const containers = await docker.getContainers()
  const { devices, devicesById } = createDevices(containers, topology)
  const links = createLinks(devicesById, topology)

  const networkConfiguration = {
    devices: devices,
    links: links,
    hosts: {},
    apps: {},
    ports: {},
    regions: {},
    layouts: {}
  }

  await fs.writeFile('./topologies/ONOS/networkConfiguration.json', JSON.stringify(networkConfiguration, null, '\t'))
  console.log('Network configuration saved as networkConfiguration.json')

  await onos.removeONOSTopology()
  setTimeout(() => onos.deployONOSTopology(networkConfiguration), 60000)

  return networkConfiguration
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

if (process.argv[2]) {
  deploy(process.argv[2])
}

module.exports = deploy
