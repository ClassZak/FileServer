#!/bin/bash

python3 -m venv .venv
. .venv/bin/activate

pip install mysql-connector Flask Flask-WTF Flask-JWT Flask-JWT-Extended bcrypt
pip install --upgrade flask-jwt-extended PyJWT
