#!/bin/zsh

set -e

rm -rf ./dist
rm -rf ./build
rm -rf ./mahiro.egg-info

python3 ./setup.py sdist bdist_wheel
twine upload dist/* -u $PYPI_USERNAME -p $PYPI_PASSWORD
