#!/bin/zsh

set -e

rm -r ./dist
rm -r ./build
rm -r ./mahiro.egg-info

python3 ./setup.py sdist bdist_wheel
twine upload dist/* -u $PYPI_USERNAME -p $PYPI_PASSWORD
