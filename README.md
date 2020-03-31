#  Emulated optical network controlled by ONOS

## Installation

### Prerequisites
#### Docker
Make sure that [Docker](https://docs.docker.com/install/#supported-platforms) and [Docker-compose](https://docs.docker.com/compose/install/) are installed.

#### Node.js
Node.js >= 8.0 required, Node.js [12.16](https://nodejs.org/en/download/) recommended.

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

To install all Node.js dependencies, write the following command
```
npm i
```