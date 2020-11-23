#!/bin/bash

# Remove the dummy Python file
rm yang/__init__.py

# Gets the pyangbind plugin path
export PYBINDPLUGIN=$(python -c 'import pyangbind; import os; print ("{}/plugin".format(os.path.dirname(pyangbind.__file__)))')

echo "> Generating bindings for all available Yangs"
# Bind all the available Yangs
pyang --plugindir $PYBINDPLUGIN -f pybind -p yang/ -o binding.py yang/*

# Checks if the binding has been created succesfully by checking the status code
if [ $? -gt 0 ] 
then
  echo "ERROR: Failed to generate the binding"
  exit 1
fi
echo "< Bindings successfully generated"