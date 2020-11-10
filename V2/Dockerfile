FROM python:3.9

WORKDIR /root

ARG YANG_URLS
ENV YANG_URLS ${YANG_URLS}

COPY . /root

# deberia ser startup la inicial
RUN mkdir yang datastore/candidate datastore/startup

RUN apt-get update -y && apt-get install -y xsltproc libxml2-utils

RUN pip install --no-cache-dir -r requirements.txt

RUN bash load-yangs.sh
RUN bash generate-bindings.sh

CMD python server.py
# CMD tail -f /dev/null
# docker build --build-arg YANG_URLS="https://raw.githubusercontent.com/openconfig/public/master/release/models/optical-transport/openconfig-terminal-device.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/optical-transport/openconfig-transport-line-protection.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/optical-transport/openconfig-transport-line-common.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/optical-transport/openconfig-transport-types.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/platform/openconfig-platform-transceiver.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/platform/openconfig-platform-linecard.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/platform/openconfig-platform-types.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/platform/openconfig-platform.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/platform/openconfig-platform-port.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/openconfig-extensions.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/types/openconfig-types.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/types/openconfig-yang-types.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/system/openconfig-alarm-types.yang https://raw.githubusercontent.com/openconfig/public/master/third_party/ietf/iana-if-type.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/interfaces/openconfig-interfaces.yang https://raw.githubusercontent.com/openconfig/public/master/third_party/ietf/ietf-interfaces.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/lldp/openconfig-lldp-types.yang https://raw.githubusercontent.com/openconfig/public/master/third_party/ietf/ietf-yang-types.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/interfaces/openconfig-if-ethernet.yang https://raw.githubusercontent.com/openconfig/public/master/release/models/lldp/openconfig-lldp.yang" .
# docker run -d -p1234:830 --name testv2 0e97de76471a