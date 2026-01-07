from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="shieldauth",
    version="1.5.0",
    author="ShieldAuth",
    author_email="support@shieldauth.com",
    description="ShieldAuth SDK for license management and protection",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/shieldauth/python-sdk",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
    install_requires=[
        "requests>=2.25.0",
    ],
)