const fs = require('fs').promises
const xml2js = require('xml2js')

const topologyParser = async (inputFile) => {
  let topologyBuffer
  try {
    topologyBuffer = await fs.readFile('topologies/Net2Plan/' + inputFile + '.n2p')
  } catch (error) {
    throw new Error('Topology ' + inputFile + ' not found. Available topologies are located at the topologies folder.')
  }

  const topology = {
    nodes: [],
    links: []
  }

  await xml2js.parseStringPromise(topologyBuffer).then((result) => {
    if (result.network.physicalTopology) {
      for (const node of result.network.physicalTopology[0].node) {
        topology.nodes.push({ id: node.$.id, name: node.$.name, latitude: node.$.yCoord, longitude: node.$.xCoord })
      }
      if (result.network.physicalTopology[0].layer) {
        for (const link of result.network.physicalTopology[0].layer) {
          topology.links.push({ id: link.$.id, originId: link.$.originNodeId, destinationId: link.$.destinationNodeId })
        }
      }
    } else {
      for (const node of result.network.node) {
        topology.nodes.push({ id: node.$.id, name: node.$.name, latitude: node.$.yCoord, longitude: node.$.xCoord })
      }
      if (result.network.layer) {
        for (const link of result.network.layer[0].link) {
          topology.links.push({ id: link.$.id, originId: link.$.originNodeId, destinationId: link.$.destinationNodeId })
        }
      }
    }
  })
    .catch((error) => {
      console.log(error)
    })
  return {
    topology: topology,
    nodeNumber: topology.nodes.length,
    linkNumber: topology.links.length
  }
}

if (process.argv[2]) {
  topologyParser(process.argv[2])
}

module.exports = {
  topologyParser
}
