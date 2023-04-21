import io
from setuptools import find_packages, setup
from mahiro.version import __VERSION__

def read_files(files):
    data = []
    for file in files:
        with io.open(file, encoding="utf-8") as f:
            data.append(f.read())
    return "\n".join(data)

setup(
    name="mahiro",
    description="Python bridge for Mahiro",
    long_description=read_files(["README.md"]),
    long_description_content_type="text/markdown",
    version=__VERSION__,
    author="fz6m",
    author_email="i@fz6m.com",
    url="https://github.com/opq-osc/mahiro",
    license="MIT",
    keywords=["OPQ", "OPQBot", "mahiro"],
    packages=find_packages(),
    install_requires=read_files(["requirements.txt"]),
    python_requires=">=3.7",
)
