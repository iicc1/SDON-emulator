#!/bin/bash

echo $YANG_URLS
for YANG_URL in $YANG_URLS
do
  echo "> Downloading $YANG_URL"
  # Downloads the Yangs on the yang/ folder quietly
  wget --quiet --directory-prefix=yang/ $YANG_URL
  # Checks if all the Yangs have been downloaded succesfully by checking the status code
  if [ $? -gt 0 ] 
  then
    echo "ERROR: Failed to download the Yang: $YANG_URL"
    exit 1
  fi
  echo "< Successful download"
done