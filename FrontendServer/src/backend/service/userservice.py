from sqlite3 import IntegrityError
from typing import Tuple, Union
import mysql.connector
from flask import Response, jsonify, request, Flask
from mysql.connector import Error
import base64

from service.aservice import AService
from validators.modelvalidator import ModelValidator
from model.user import User, UserJSONModel

# JWT
from flask_jwt_extended import (
	JWTManager, create_access_token,
	get_jwt_identity, jwt_required,
	set_access_cookies, unset_jwt_cookies
)
# Flask
from flask import(
	Flask,				Request,	json,
	render_template,	request,	jsonify,
	redirect,			url_for
)

import bcrypt

class UserService(AService):
	TABLE_NAME = 'User'
	def __init__(self, config_file:str):
		super().__init__(config_file)

	"""
	CREATE TABLE `User` (
		Id				INT AUTO_INCREMENT PRIMARY KEY,
		Login			VARCHAR(64) UNIQUE NOT NULL,
		PasswordHash	CHAR(60) NOT NULL, -- bcrypt
		CreatedAt		TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	"""

	"""
		CRUD операции
	"""
	# data = {login: str, password: str}
	def create_user(self, data:dict) -> Tuple[Response, int]:
		try:
			validated = ModelValidator.validate(data, UserJSONModel.FIELDS_META)
			if not validated.get('login') or not validated.get('password'):
				return jsonify({'error' : 'При регистрации не указан логин и/или пароль'}) , 400
			
			if self.exists_login(validated['login']):
				return jsonify({'error' : f"Логин {validated['login']} уже существует"}), 400


			self.connect()
			validated['password_hash'] =\
			bcrypt.hashpw(validated['password'].encode('utf-8'), bcrypt.gensalt(14)).decode('utf-8')
			
			values = (validated['login'], validated['password_hash'])
			db_columns = [User.DB_COLUMNS['columns']['login'], User.DB_COLUMNS['columns']['password_hash']]

			
			query = f"""
				INSERT INTO `{UserService.TABLE_NAME}` ({','.join(db_columns)})
				VALUES ({','.join(['%s'] * len(values))})
			"""

			self.cursor.execute(query, values)
			self.connection.commit()

			return jsonify({'message' : 'Пользователь успешно создан'}) , 201
		except ValueError as e:
			return jsonify({'error' : str(e)}), 400
		except IntegrityError as e:
			self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		except Error as e:
			if self.connection:
				self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	"""
		CRUD операции
	"""




	"""
		Простые методы
	"""
	def sql_data_to_json_list(self, data:dict):
		return {field:str(
			data[User.DB_COLUMNS['columns'][field]]) for field in User.FIELDS_META.keys()}
	
	def exists(self, id: int) -> bool:
		try:
			self.connect()
			query = f"""
				SELECT EXISTS(SELECT 1 FROM `{UserService.TABLE_NAME}`
				WHERE {User.DB_COLUMNS['columns']['id']} = %s) AS exist
			"""
			self.cursor.execute(query, (int(id),))
			result = self.cursor.fetchone()
			return bool(result['exist']) if result else False
		finally:
			self.disconnect()
	def exists_login(self, login: str) -> bool:
		try:
			self.connect()
			query = f"""
				SELECT EXISTS(SELECT 1 FROM `{UserService.TABLE_NAME}`
				WHERE {User.DB_COLUMNS['columns']['login']} = %s) AS exist
			"""
			self.cursor.execute(query, (login, ))
			result = self.cursor.fetchone()
			return bool(result['exist']) if result else False
		finally:
			self.disconnect()
	"""
		Простые методы
	"""




	"""
		Доп. запросы
	"""
	# data = {login: str, password: str}
	def authorization(self, data:dict, next_url: str = '/') -> Tuple[Response, int]:
		try:
			validated = ModelValidator.validate(data, UserJSONModel.FIELDS_META)
			if not validated.get('login') or not validated.get('password'):
				return jsonify({'error' : 'При авторизации не указан логин и/или пароль'}) , 400
			
			if not self.exists_login(validated['login']):
				return jsonify({'error' : 'Неверный логин и/или пароль'}), 401
			
			self.connect()
			query = f"""
				SELECT {User.DB_COLUMNS['columns']['password_hash']}
				FROM {UserService.TABLE_NAME} WHERE {User.DB_COLUMNS['columns']['login']} = %s
			"""
			self.cursor.execute(query, (validated['login'], ))
			user = self.cursor.fetchone()

			if not bcrypt.checkpw(\
				validated['password'].encode('utf-8'),
				user[User.DB_COLUMNS['columns']['password_hash']].encode('utf-8')
			):
				return jsonify({'error' : 'Неверный логин и/или пароль'}), 401
			else:
				access_token = create_access_token(identity=validated['login'])
				response = redirect(next_url)
				set_access_cookies(response, access_token)
				return response
		except ValueError as e:
			return jsonify({'error' : str(e)}), 400
		except IntegrityError as e:
			self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		except Error as e:
			if self.connection:
				self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	"""
		Доп. запросы
	"""