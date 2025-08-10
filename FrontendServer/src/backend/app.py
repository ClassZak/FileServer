import os
from typing import Dict
from flask import Flask, Request, json, render_template, request, jsonify
from markupsafe import escape
import base64
from datetime import datetime




# Сущность приложения и конфиг
app = Flask(
	__name__,
	static_folder='../frontend/static',
	template_folder='../frontend/template'
)
from flask_wtf.csrf import CSRFProtect
def get_app_config(filename:str='FrontendServer/src/backend/.password.json'):
	with open(filename, 'r', encoding='UTF-8') as file:
		return json.load(file)
app_config = get_app_config()




# Настройка CSRF
app.secret_key = app_config['secret_key']
csrf = CSRFProtect(app)




# JWT
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
app.config["JWT_SECRET_KEY"] = app_config['jwt_secret_key']
jwt = JWTManager(app)
import ssl




# Маршруты
# Базовые маршруты
@app.route('/')
def root():
	return render_template('index.html')

@app.route('/files_search')
def files_search():
	return 405


# Сервисные маршруты




# Точка входа
def main():
	try:
		ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
		ssl_context.load_cert_chain('FrontendServer/cert.pem', 'FrontendServer/key.pem')
		app.run(debug=True, host='0.0.0.0', port=5000, ssl_context = ssl_context)
	except Exception as e:
		print(e)
		pass

if __name__=='__main__':
	main()

