const fetch = require('node-fetch')

// TODO
// In order to operate with ONOS in a different host than the Docker Containers,
// A substitution of the IP in the topology could be done
// The problem comes with the callbacks
// A callback IP may be included in the Dockerfile as an ENV variable.
// IE: CALLBACK_IP: <"host"|ip>
// if CALLBACK_IP == "host" => /sbin/ip route|awk '/default/ { print $3 }'
// else, CALLBACK_IP = IP
// Another option is to have an intermediate address to send the callback

const deployONOSTopology = async (networkConfiguration) => {
  return fetch(process.env.ONOS_API_ENDPOINT + 'network/configuration', {
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
      console.log('ONOS topology has been updated successfully.')
    })
    .catch((error) => {
      throw new Error(error.message)
    })
}

const removeONOSTopology = async () => {
  // ONOS network configuration must be cleared as well
  return fetch(process.env.ONOS_API_ENDPOINT + 'network/configuration', {
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

module.exports = {
  deployONOSTopology, removeONOSTopology
}
