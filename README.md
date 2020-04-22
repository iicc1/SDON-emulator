#  Emulated optical network controlled by ONOS
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Installation

### Prerequisites
#### Docker
Make sure that [Docker](https://docs.docker.com/install/#supported-platforms) and [Docker-compose](https://docs.docker.com/compose/install/) are installed.

#### Node.js
Node.js >= 8.0 required, Node.js [13](https://nodejs.org/en/download/) recommended.

### Dependencies

Download a ONOS image through DockerHub. Tag `2.3.0` is recommended.
```
docker pull onosproject/onos:2.3.0
```
Run the image in the background. The container will be named `onos`
```
docker run -t -d -p 8181:8181 -p 8101:8101 -p 5005:5005 -p 830:830 --name onos onosproject/onos:2.3.0
```
After this, the ONOS GUI should be visible on your browser: http://localhost:8181/onos/ui/login.html
The default user and password is `karaf`

-------

To install all Node.js dependencies, use the following command
```
npm i
```


## Configuration

### Docker
Create an internal network called `sdn_optical_network`
```
docker network create sdn_optical_network
```

Attach `onos` container to the network
```
docker network connect sdn_optical_network onos
```

### ONOS

Use the following command to access to ONOS console
```
ssh onos@localhost -p 8101
```
Pasword for `onos` user is `rocks`.
Press `control + d` to exit.

Install the apps `odtn-service, roadm` and `optical-rest` with the `app activate` command
```
app activate odtn-service
app activate roadm
app activate optical-rest
```
----



