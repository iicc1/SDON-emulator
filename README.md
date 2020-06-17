#  Emulated optical network controlled by ONOS
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=for-the-badge)](https://standardjs.com) ![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/ignacioxyz/sdn_optical_network?style=for-the-badge) ![Docker Pulls](https://img.shields.io/docker/pulls/ignacioxyz/sdn_optical_network?style=for-the-badge)

## Installation

### Prerequisites
#### Docker
Make sure that [Docker](https://docs.docker.com/install/#supported-platforms) and [Docker-compose](https://docs.docker.com/compose/install/) are installed.

#### Node.js
Node.js >= 8.0 required, Node.js [13](https://nodejs.org/en/download/) recommended.

### Dependencies
Download a ONOS image through DockerHub or use an already existing ONOS instalation.

#### Download and run ONOS from Dockerhub 
Tag `2.3.0` is recommended.
```
docker pull onosproject/onos:2.3.0
```
Run the image in the background. The container will be named `onos`
```
docker run -t -d -p 8181:8181 -p 8101:8101 -p 5005:5005 -p 830:830 --name onos onosproject/onos:2.3.0
```
After some seconds, the ONOS GUI should be visible on your browser: http://localhost:8181/onos/ui/login.html
The default user and password is `karaf`

#### Install Node.js dependencies
To install all Node.js dependencies, use the following command
```
npm i
```

## Configuration
### Environment
This project uses `.env` files for the configuration variables.

There is an existing `env.example` file with all the existing variables and its default values.
Rename it to `.env` and modify the data if neccesary.
### Docker
Create an internal network called `sdn_optical_network`
```
docker network create sdn_optical_network
```

Attach the `onos` container to the network
```
docker network connect sdn_optical_network onos
```

### ONOS
Use the following command to access to ONOS console
```
ssh onos@localhost -p 8101
```
Pasword for `onos` user is `rocks`.
Install the apps `odtn-service, roadm` and `optical-rest` with the `app activate` command
```
app activate odtn-service
app activate roadm
app activate optical-rest
```
Press `control + d` to exit.

_These installations can also be done on the ONOS GUI._

## Deploy to ONOS
Run the Node.js server
```
node api/server.js
```
Then, open a browser or use a tool like Postman, and try to deploy a network
```
http://localhost:7000/deploy/net2plan/example7nodes
````
After one minute, the topology should be visible on ONOS with all devices and links ready. Refresh the GUI if some components are missing.

![Topology view on ONOS](https://i.imgur.com/HakU5ux.jpg)

To view the nodes over a map, open the menu located at the bottom right corner and activate the options "Select background geo map" and "Toogle background geo map".

Unfortunately, it seems that ONOS does not really removes the links and nodes, so if you continue deploying more topologies, everything will be scrambled.
To solve this, the ONOS container must be removed and relaunched, so all the data gets cleared.