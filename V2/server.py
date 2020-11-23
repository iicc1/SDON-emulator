from __future__ import absolute_import, division, unicode_literals, print_function, nested_scopes
import argparse
import datetime
import logging
import os
import platform
import socket
import sys
import time
import re
from netconf import error, server, util
from netconf import nsmap_add, NSMAP
from lxml import etree
import xml.etree.ElementTree as ET

nsmap_add("sys", "urn:ietf:params:xml:ns:yang:ietf-system")


def process_changes(data_to_insert_xml, current_config_xml):

    config_tree = etree.ElementTree(current_config_xml)
    data_tree = etree.ElementTree(data_to_insert_xml)

    identifier_tag = ""
    identifier_value = ""

    for subitem_data in data_to_insert_xml.iter():
        if subitem_data.text.strip() != "":
            identifier_tag = subitem_data.tag
            identifier_value = subitem_data.text
            target_element_path = data_tree.getelementpath(subitem_data)
            target_element_data = data_tree.find(target_element_path).getparent()
            break


    target_element_config = None

    for subitem_config in current_config_xml.iter():
        if subitem_config.tag == identifier_tag and subitem_config.text.strip() == identifier_value:
            element_path = config_tree.getelementpath(subitem_config)
            target_element_config = config_tree.find(element_path).getparent()
            break

    if target_element_config is not None:
        target_element_config_tree = etree.ElementTree(target_element_config)

    target_element_data_tree = etree.ElementTree(target_element_data)

    if target_element_config is None:
        element_data_path = data_tree.getelementpath(target_element_data)
        element_data_path_split = element_data_path.split("/{")
        element_data_path_split.pop()
        parent_path = ""
        for subpath in element_data_path_split:
            parent_path = parent_path + "/{" + subpath

        parent_path = parent_path[2:len(parent_path)]
        parent_element = config_tree.find(parent_path)
        parent_element.insert(len(parent_element.getchildren()), target_element_data)

    else:

        for data_item in target_element_data.iter():

            if data_item.text.strip() != "":
                path = target_element_data_tree.getelementpath(data_item)
                config_subel = target_element_config_tree.find(path)

                if config_subel is None:
                    path_split = path.split("/{")
                    path_split.pop()
                    parent_path = ""
                    for subpath in path_split:
                        parent_path = parent_path + "/{" + subpath

                    parent_path = parent_path[2:len(parent_path)]
                    parent_element = target_element_config_tree.find(parent_path)
                    parent_element.insert(len(parent_element.getchildren()), data_item)

                else:
                    if config_subel.text != data_item.text:
                        config_subel.text = data_item.text


    return current_config_xml

def parse_password_arg(password):
    if password:
        if password.startswith("env:"):
            unused, key = password.split(":", 1)
            password = os.environ[key]
        elif password.startswith("file:"):
            unused, path = password.split(":", 1)
            password = open(path).read().rstrip("\n")
    return password

# Ignacio
def get_config_by_datastore(data, datastore):
  # Read running configuration from the config file
  config_file = open('datastore/' + datastore + '/config.xml')
  config_string = config_file.read()
  config_etree = etree.fromstring(config_string) # .XML is also valid
  # Iterate over the configuration data and insert into the data
  for config_child_etree in config_etree:
    print(config_child_etree.tag, config_child_etree.attrib)
    data.append(config_child_etree)
  return data
  
# Ignacio
def save_config_by_datastore(data, datastore):
  # Read running configuration from the config file
  config_file = open('datastore/' + datastore + '/config1.xml', 'w+')
  config_file.write(etree.tostring(data, pretty_print = True).decode("utf-8"))

class SystemServer(object):
    def __init__(self, port, host_key, auth, debug):
        self.server = server.NetconfSSHServer(auth, self, port, host_key, debug)

    def close():
        self.server.close()

    def nc_append_capabilities(self, capabilities):  # pylint: disable=W0613
        """The server should append any capabilities it supports to capabilities"""
        util.subelm(capabilities, "capability").text = "urn:ietf:params:netconf:capability:xpath:1.0"
        util.subelm(capabilities, "capability").text = NSMAP["sys"]


    def rpc_edit_config(self, session, rpc, *unused_params):
        logging.info("Received edit-config rpc:\n" + etree.tostring(rpc, pretty_print = True).decode("utf-8"))
        # Add Netconf header to all responses
        response = util.elm("ok")
        data_to_insert_xml = etree.fromstring(etree.tostring(rpc[0][1])) ########## el
        #data_to_insert_xml = etree.fromstring(etree.tostring(rpc[0][1][1])) ######## yo
        print(data_to_insert_xml) # el
        # target rpc[0][0]
        # data rpc[0][1]
        #####new_config = rpc[0][1][1]
        #####target_datastore = 'running' ##########re.sub('{.*}', '', rpc[0][0][0].tag)

        current_config = util.elm("data")
        # Read running configuration from the config file
        current_config = get_config_by_datastore(current_config, 'running')
        current_config_internal = current_config[0] ## Realmente estamos cogiendo la config primera, que es la de platform
        # Para hacer esto habria que iterar las configus y hacer el process changes. y un trycatch aqui en el processchanges
        # ademas habria que construir el fichero de config final.
        # Nota: el edit se hace referente al contenido interno. Es decir:
        # config: <openconfigplatform><components></components></openconfigplatform>  edit: <components></components> 
        # si guardamos sin lo de openconfig, seria:
        # config: <components><component></component></components>  edit: <component></component>
        # Entonces hay dos opciones para la config, guardarla con <openconfig o no. vamos a hacerlo con para no editar el editconfig.
        # para los demas rpc quizas hay que coger lo de dentro

        # Edit the current config and build the new config
        print('a')
        logging.info("Received edit-config rpc:\n" + etree.tostring(current_config_internal, pretty_print = True).decode("utf-8"))
        new_config_internal = process_changes(data_to_insert_xml, current_config_internal)
        print('b')
        new_config = util.elm('data')
        new_config.append(new_config_internal)
        # Save the new config
        save_config_by_datastore(new_config, 'running')
        logging.info("Saved new config")

        return response

    def rpc_get(self, session, rpc, filter_or_none):
        logging.info("Received get rpc:\n" + etree.tostring(rpc, pretty_print = True).decode("utf-8"))
        # Add Netconf header to all responses
        response = util.elm("nc:data")
        # ONOS TEST
        # Checks if has the tag and no childs, then send special reply # TODO funcion de nesting maximo o usar las busquedas
        #if len(rpc[0]) and len(rpc[0][0]) and len(rpc[0][0][0]) and len(rpc[0][0][0][0]) and len(rpc[0][0][0][0][0]) and len(rpc[0][0][0][0][0][0]) and rpc[0][0][0][0][0][0].tag == "terminal-device" and not len(rpc[0][0][0][0][0][0]):
        # las rpc de onos son mas cortas, creo que va a ser mejor usar otro netconf client
        if len(rpc[0]) and len(rpc[0][0]):
          print('asdadas')
          
          logging.info('DENTRO') # SOLO SALE EN ONOS ESTO, NO LOS PRINT
          response = get_config_by_datastore(response, 'running')
          print(response)
          print(etree.tostring(response[1][0], pretty_print = True).decode("utf-8"))
          response2 = util.elm("nc:data")
          response2.append(response[1][0])
          # LIMPIAR DE NS0
          response_str =  etree.tostring(response2).decode("utf-8")
          response_str = response_str.replace("ns0:", "")
          response2 = etree.fromstring(response_str)
          return response2
          #return util.filter_results(rpc, response[0], filter_or_none)  quiere solo Passed in key must select exactly one node: data/terminal-device/logical-channel
        print('+++++++++')
        logging.info('FUERA')


        # Read running configuration from the config file
        response = get_config_by_datastore(response, 'running')
        return util.filter_results(rpc, response, filter_or_none)

    def rpc_get_config(self, session, rpc, source_elm, filter_or_none):  # pylint: disable=W0613
        """Passed the source element"""
        data = util.elm("nc:data")
        # Config Data
        self._add_config(data)
        return util.filter_results(rpc, data, filter_or_none)


def main(*margs):
    parser = argparse.ArgumentParser("Netconf server")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument("--password", default="admin", help='Use "env:" or "file:" prefix to specify source')
    parser.add_argument('--port', type=int, default=830, help='Netconf server port')
    parser.add_argument("--username", default="admin", help='Netconf username')
    args = parser.parse_args(*margs)

    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO)

    args.password = parse_password_arg(args.password)
    host_key = os.path.join(os.path.abspath(os.path.dirname(__file__)), "server-key")

    auth = server.SSHUserPassController(username=args.username, password=args.password)
    s = SystemServer(args.port, host_key, auth, args.debug)

    if sys.stdout.isatty():
        print("Control + C to quit server")
    try:
        while True:
            time.sleep(1)
    except Exception:
        print("Quitting server")

    s.close()


if __name__ == "__main__":
    main()

__author__ = 'Ignacio Iglesias Castreño'
__date__ = 'October 2020'
__version__ = '1.0'
__docformat__ = "restructuredtext en"

###### OLD CODE
# Append the configuration files to the Netconf response
       # logging.info('Loading datastore running config')
      #  for datastore_running_file in datastore_running_files:
          #  datastore_running_file_read = open(datastore_running_file, "r")
            #datastore_running_file_string = datastore_running_file_read.read()
            # print(datastore_running_file_string)
         #   datastore_running_file_etree = etree.fromstring(datastore_running_file_string) # .XML is also valid
         #   response.insert(1, datastore_running_file_etree)
#

