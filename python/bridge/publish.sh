#!/bin/zsh

rm ./dist
rm ./build
rm ./mahiro.egg-info

python3 ./setup.py sdist bdist_wheel
twine upload dist/* -u $PYPI_USERNAME -p $PYPI_PASSWORD
