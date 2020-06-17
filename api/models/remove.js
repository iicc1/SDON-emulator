require('dotenv')
const docker = require('../helpers/docker')
const onos = require('../helpers/onos')

const remove = async (option) => {
  const containers = await docker.getContainers()
  if (option === 'containers') {
    await docker.removeContainers(containers)
  } else if (option === 'topology') {
    await onos.removeONOSTopology()
  } else if (option === 'all') {
    await docker.removeContainers(containers)
    await onos.removeONOSTopology()
  } else {
    throw new Error('Remove option "' + option + '" not supported.')
  }
  return option + ' cleared.'
}

if (process.argv[2]) {
  remove(process.argv[2])
}

module.exports = remove
