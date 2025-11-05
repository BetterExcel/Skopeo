#!/bin/bash

SCRIPTS_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_DIR=$(dirname $SCRIPTS_DIR)
CUR_DIR=$(pwd)

cd $PROJECT_DIR

# Python setup
python3.12 -m venv .venv 
source .venv/bin/activate 
pip install --upgrade pip
pip install -r requirements.txt

cd $CUR_DIR
