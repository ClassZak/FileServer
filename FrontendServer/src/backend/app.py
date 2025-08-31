import os
from typing import Dict
from flask import(
	Flask,				Request,	json,
	render_template,	request,	jsonify,
	redirect,			url_for
)
from flask_jwt_extended.exceptions import NoAuthorizationError, JWTDecodeError
from markupsafe import escape
import base64
import datetime



config_path = 'FrontendServer/src/backend/.password.json'



# Сервисы
from service.userservice import UserService
from service.groupservice import GroupService
user_service = UserService(config_path)
group_service = GroupService(config_path)




# Utilites
# Получение словаря из формы
def get_dict_from_request_form(request:Request) -> Dict:
	return {
		k:v
		for k in request.form.keys() 
			for v in request.form.getlist(k)
	}
def get_data_from_request(request: Request) -> Dict:
	if request.is_json:
		return request.get_json()
	else:
		return get_dict_from_request_form(request)




# Сущность приложения и конфиг
app = Flask(
	__name__,
	static_folder='../frontend/static',
	template_folder='../frontend/template'
)
from flask_wtf.csrf import CSRFProtect
def get_app_config(filename:str=config_path):
	with open(filename, 'r', encoding='UTF-8') as file:
		return json.load(file)
app_config = get_app_config()




# Настройка CSRF
app.secret_key = app_config['secret_key']
csrf = CSRFProtect(app)
csrf.init_app(app)



# JWT
from flask_jwt_extended import (
	JWTManager, create_access_token,
	get_jwt_identity, jwt_required,
	set_access_cookies, unset_jwt_cookies, verify_jwt_in_request
)
app.config['JWT_SECRET_KEY'] = app_config['jwt_secret_key']
jwt = JWTManager(app)
import ssl




# Настройка JWT 
# Для запретных страниц
def login_required(fn):
	@jwt_required(optional=True)
	def wrapper(*args, **kwargs):
		if not get_jwt_identity():
			# Сохраняем запрошенный URL для перенаправления после авторизации
			next_url = request.url
			return redirect(url_for('login', next_url=next_url))
		return fn(*args, **kwargs)
	return wrapper
# Обраюботка ошибок авторизацции
@app.errorhandler(NoAuthorizationError)
@app.errorhandler(JWTDecodeError)
def handle_auth_error(e):
	next_url = request.url
	return redirect(url_for('login', next_url=next_url))
# Глобальный обработчик истекшего токена
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
	next_url = request.url
	return redirect(url_for('login', next_url=next_url))




# Маршруты
# Базовые маршруты
@app.route('/')
def root():
	return render_template('index.html')
@app.route('/about')
def about():
	return render_template('about.html')
@app.route('/account')
@login_required
def account():
	current_user = get_jwt_identity()
	# Проверка на то, что пользователь авторизован
	if not current_user:
		return redirect(url_for('login', next_url=request.url))
	
	return render_template(
		'account.html', 
		username=current_user
	)
@app.route('/register')
def register_page():
	try:
		verify_jwt_in_request(optional=True)
		current_user = get_jwt_identity()
		if current_user:
			# Для AJAX-запросов возвращаем JSON
			if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
				return jsonify({'redirect': url_for('account')}), 200
			# Для обычных запросов - редирект
			app.logger.debug(f"Redirecting to account")
			return redirect('/account')
	except Exception as e:
		app.logger.debug(f"JWT check failed: {e}")
	csrf_token = generate_csrf()
	return render_template('classes/register.html', csrf_token=csrf_token)


from flask_wtf.csrf import CSRFProtect, generate_csrf, validate_csrf

@app.route('/login', methods=['GET', 'POST'])
def login():
	# Проверяем, авторизован ли уже пользователь
	try:
		verify_jwt_in_request(optional=True)
		current_user = get_jwt_identity()
		if current_user:
			# Для AJAX-запросов возвращаем JSON
			if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
				return jsonify({'redirect': url_for('account')}), 200
			# Для обычных запросов - редирект
			app.logger.debug(f"Redirecting to account")
			return redirect('/account')
	except Exception as e:
		app.logger.debug(f"JWT check failed: {e}")
	# Генерируем CSRF токен
	csrf_token = generate_csrf()
	
	data = get_dict_from_request_form(request)
	next_url = request.args.get('next_url', '/')
	if data.get('next_url'):
		next_url = data['next_url']

	if request.method == 'POST':
		if data.get('next_url'):
			data.pop('next_url')
		
		# Проверяем CSRF токен для POST-запросов
		try:
			validate_csrf(request.form.get('csrf_token'))
		except Exception as e:
			print(e, csrf_token)
			return jsonify({'error': 'Invalid CSRF token'}), 400
		
		return user_service.authorization(data, next_url)
	else:
		# Отображаем форму входа с сохраненным next_url и CSRF токеном
		return render_template('classes/login.html', 
							next_url=next_url,
							csrf_token=csrf_token)








# Сервисные маршруты
# API
# Авторизация
@app.route('/api/verify_token', methods=['POST'])
@jwt_required()
def verify_token():
	current_user = get_jwt_identity()
	return jsonify({
		'valid': True,
		'user': current_user
	}), 200

# Выход
@app.route('/api/logout')
def logout():
	response = redirect('/')
	unset_jwt_cookies(response)

	return response

# Регистрация
@app.route('/api/register', methods = ['POST'])
def register():
	return user_service.create_user(get_data_from_request(request))




# Группы
@app.route('/api/groups', methods = ['GET','POST'])
def group_route():
	if request.method == 'GET':
		return group_service.read_groups()
	elif request.method == 'POST':
		return group_service.create_group(get_data_from_request(request))


# Файлы
@app.route('/api/files_search')
def files_search():
	try:
		pass
	except Exception as e:
		pass
	finally:
		return render_template('http_error.html', error = 405)




# Точка входа
def main():
	#TODO: Настроить время авторизации для продакшена
	try:
		ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
		ssl_context.load_cert_chain('FrontendServer/cert.pem', 'FrontendServer/key.pem')

		app.config.update({
			"JWT_TOKEN_LOCATION": ["headers", "cookies"],
			"JWT_COOKIE_SECURE": True,     # Отправлять только по HTTPS
			"JWT_COOKIE_CSRF_PROTECT": True,
			"JWT_CSRF_CHECK_FORM": True,
			"JWT_ACCESS_COOKIE_PATH": "/",
			"JWT_REFRESH_COOKIE_PATH": "/",
			"JWT_ACCESS_TOKEN_EXPIRES": datetime.timedelta(days=10, seconds=10, microseconds=0, milliseconds=0, minutes=0, hours=0, weeks=0),
			"JWT_SESSION_COOKIE": False,
			"JWT_CSRF_HEADER_NAME": 'X-CSRF-Token'
		})
		app.run(debug=True, host='0.0.0.0', port=5000, ssl_context = ssl_context)
	except Exception as e:
		print(e)

if __name__=='__main__':
	main()

