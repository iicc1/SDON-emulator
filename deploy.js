const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs').promises
const fetch = require('node-fetch')

const ONOS_API_USER = 'karaf' // Default
const ONOS_API_PASSWORD = 'karaf' // Default

async function deploy(instances_number) {
    console.log('Deploying ' + instances_number + ' agents...')

    //const previous_containers = await getContainers()
    //await deleteContainers(previous_containers)

    await createContainers(instances_number)

    const containers = await getContainers()

    const devices = createDevices(containers)
    const links = createLinks(containers)

    const network_configuration = {
        devices: devices,
        links: links
    }

    await fs.writeFile('network_configuration.json', JSON.stringify(network_configuration, null,'\t'))
    console.log('Network configuration saved as network_configuration.json')

    await deleteOnosNetwork()
    await deployOnosNetwork(network_configuration)
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

async function getContainers() {
    let docker_ps_std = await exec('docker ps --format "{{.Names}}"')
    let container_ids = docker_ps_std.stdout.split('\n')
    let container_ids_filtered = []
    for (let container_id of container_ids) {
        if (container_id.includes('sdn_optical_network_agent_')) {
            container_ids_filtered.push(container_id)
        } 
    }

    let containers = []
    for (let i in container_ids_filtered) {
        let docker_inspect_std = await exec('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ' + container_ids_filtered[i])
        // check
        containers[i] = {}
        containers[i].name = container_ids[i]
        containers[i].ip = docker_inspect_std.stdout.replace('\n', '')
        containers[i].port = 830
    }
    console.log(containers)
    return containers
}

async function deleteContainers(containers) {
    // Containers must be removed, otherwise ONOS will continue to connect to them
    for (let container of containers) {
        console.log(container.name)
        await exec('docker rm -f ' + container.name)
    }
}

async function createContainers(n) {
    await exec('docker-compose up -d --build --scale agent=' + n)
}

function createDevices(containers) {
    let devices = {}
    for (let container of containers) {
        devices['netconf:' + container.ip + ':' + container.port] = {
            basic: {
                name: container.name,
                driver: 'cassini-openconfig'
            },
            netconf: {
                ip: container.ip,
                port: container.port,
                username: 'root',
                password: 'root',
                'idle-timeout': 0
            }
        }
    }
    return devices
}

function createLinks(containers) {
    let links = {}
    for (let container of containers) {
        links['netconf:' + container.ip + ':' + container.port + '/201-netconf:172.22.0.8:830/' + randomNumber(201, 220)] = {
            basic: {
                type: 'OPTICAL',
                metric: '1',
                durable: true,
                bidirectional: true
            },
        }
    }
    return links
}

async function deleteOnosNetwork() {
    // ONOS network configuration must be cleared as well
    return await fetch('http://localhost:8181/onos/v1/network/configuration', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            "Accept": "application/json",
            'Authorization': 'Basic ' + Buffer.from(ONOS_API_USER + ':' + ONOS_API_PASSWORD).toString('base64'),
        }
    })
    .then((response) => {
        if (response.ok) {
            return response
        } else {
            throw new Error('Response code: ' + response.status + '\nResponse error: ' + response.statusText);
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
    });
}

async function deployOnosNetwork(network_configuration) {
    return await fetch('http://localhost:8181/onos/v1/network/configuration', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(ONOS_API_USER + ':' + ONOS_API_PASSWORD).toString('base64'),
        },
        body: JSON.stringify(network_configuration, null, '\t')
    })
    .then((response) => {
        if (response.ok) {
            return response
        } else {
            throw new Error('Response code: ' + response.status + '\nResponse error: ' + response.statusText);
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
    });
}

function randomNumber(min, max) {  
    return Math.floor(
      Math.random() * (max - min + 1) + min
    )
  }

if (process.argv[2]) {
    deploy(process.argv[2])
}


module.exports = deploy