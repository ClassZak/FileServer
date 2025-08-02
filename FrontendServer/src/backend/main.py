import os
from typing import Dict
from flask import Flask, Request, json, render_template, request, jsonify
from markupsafe import escape
import base64
from datetime import datetime

from flask_wtf.csrf import CSRFProtect



app = Flask(
	__name__,
	static_folder='../frontend/static',
	template_folder='../frontend/template'
)
app.secret_key = 'dfhhfhghfhfgh'
csrf = CSRFProtect(app)

log_path = ''



@app.route('/')
def root():
	return render_template('index.html')

@app.route('/files_search')
def files_search():
	return 405


# Точка входа
def main():
	try:
		app.run(debug=True, host='0.0.0.0', port=5000)
	except Exception as e:
		print(e)
		pass

if __name__=='__main__':
	main()

