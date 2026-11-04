from setuptools import setup, find_packages

setup(
    name="shieldauth",
    version="1.5.0",
    author="MF",
    description="ShieldAuth SDK for license management and protection",
    url="https://github.com/bravo-mp4/ShieldAuth",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
    install_requires=[
        "requests>=2.25.0",
    ],
)