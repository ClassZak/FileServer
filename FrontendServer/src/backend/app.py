import os
from typing import Dict
from flask import(
	Flask,				Request,	json,
	render_template,	request,	jsonify,
	redirect,			url_for
)
import flask_jwt_extended
from flask_jwt_extended.exceptions import NoAuthorizationError, JWTDecodeError
from markupsafe import escape
import base64
import datetime



config_path = 'FrontendServer/src/backend/.config.json'



# Сервисы
from service.userservice import UserService
from service.groupservice import GroupService
from service.publicgroupservice import PublicGroupService
user_service = UserService(config_path)
group_service = GroupService(config_path)
public_group_service = PublicGroupService(config_path)




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
from flask_wtf.csrf import CSRFProtect, CSRFError
def get_app_config(filename:str=config_path):
	with open(filename, 'r', encoding='UTF-8') as file:
		return json.load(file)
app_config = get_app_config()



# Настройка CSRF
app.secret_key = app_config['secret_key']
#csrf = CSRFProtect(app)
#csrf.init_app(app)



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
@app.errorhandler(CSRFError)
def handle_csrf_error(e):
	return jsonify({'error': f'CSRF validation failed: {e.description}'}), 400
@app.before_request
def log_request():
	#app.logger.debug(f"Headers: {request.headers}")
	#app.logger.debug(f"Cookies: {request.cookies}")
	pass



# Маршруты
# Базовые маршруты
@app.route('/')
def root():
	return render_template('index.html')
@app.route('/about')
def about():
	return render_template('about.html')
@app.route("/account")
@login_required
def account():
	current_user = get_jwt_identity()
	csrf_token = generate_csrf()
	return render_template("account.html", username=current_user, csrf_token=csrf_token)

# Регистрация
@app.route("/register", methods=["GET", "POST"])
def register():
	# Если уже вошёл — не даём регистрироваться
	try:
		verify_jwt_in_request(optional=True)
		if get_jwt_identity():
			return redirect("/account")
	except Exception as e:
		app.logger.debug(f"JWT check failed: {e}")

	csrf_token = generate_csrf()
	if request.method == "POST":
		form_data = request.form.to_dict()
		try:
			validate_csrf(form_data.get("csrf_token"))
		except Exception:
			return jsonify({"error": "Неверный CSRF токен"}), 400

		return user_service.create_user(form_data)

	return render_template("classes/register.html", csrf_token=csrf_token)



from flask_wtf.csrf import CSRFProtect, generate_csrf, validate_csrf

@app.route("/login", methods=["GET", "POST"])
def login():
	# Если уже вошёл — редиректим на account
	try:
		verify_jwt_in_request(optional=True)
		if get_jwt_identity():
			return redirect("/account")
	except Exception as e:
		app.logger.debug(f"JWT check failed: {e}")

	csrf_token = generate_csrf()
	if request.method == "POST":
		form_data = request.form.to_dict()
		try:
			validate_csrf(form_data.get("csrf_token"))
		except Exception:
			return jsonify({"error": "Неверный CSRF токен"}), 400

		return user_service.authorization(form_data, request.args.get("next_url", "/"))

	return render_template("classes/login.html",
						next_url=request.args.get("next_url", "/"),
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




# Группы
@app.route('/api/groups', methods=['GET', 'POST'])
@jwt_required()  # Добавляем JWT аутентификацию
def group_route():
	current_user = get_jwt_identity()
	user_id = user_service.get_id_by_login(current_user)
	
	if request.method == 'GET':
		return group_service.read_groups()
	elif request.method == 'POST':
		data = get_data_from_request(request)
		data['id_leader'] = user_id  # Добавляем ID владельца
		return group_service.create_group(data)
@app.route('/api/groups/public', methods = ['GET','POST'])
@jwt_required() 
def public_group_route():
	try:
		verify_jwt_in_request(optional=True)
		current_user = get_jwt_identity()
		if not current_user:
			return redirect('/login')
		if request.method == 'GET':
			return public_group_service.read_groups_by_user_id(
				user_service.get_id_by_login(current_user))
		elif request.method == 'POST':
			return 
	except flask_jwt_extended.exceptions.CSRFError as e:
		app.logger.debug(f"JWT check failed: {e}")
		return jsonify({'error':f"JWT check failed: {e}"}), 400
	except Exception as e:
		return jsonify({'error':str(e)}), 500

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
			"JWT_TOKEN_LOCATION": ["cookies"],  # только cookies
			"JWT_COOKIE_SECURE": False,         # True в проде (только HTTPS)
			"JWT_COOKIE_CSRF_PROTECT": True,    # включаем CSRF защиту
			"JWT_ACCESS_TOKEN_EXPIRES": datetime.timedelta(
				days=10, 
				seconds=10, 
				microseconds=0, 
				milliseconds=0, 
				minutes=0, 
				hours=0, 
				weeks=0
			),
		})
		app.run(debug=True, host='0.0.0.0', port=5000, ssl_context = ssl_context)
	except Exception as e:
		print(f'Exception in main: {e}')

if __name__=='__main__':
	main()

