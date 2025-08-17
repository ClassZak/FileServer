from sqlite3 import IntegrityError
from typing import Tuple, Union
import mysql.connector
from flask import Response, jsonify, request, Flask
from mysql.connector import Error
import base64

from service.aservice import AService
from validators.modelvalidator import ModelValidator
from model.user import User

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
			self.connect()
			validated = ModelValidator.validate(data, User.FIELDS_META)
			if not validated.get('login') or not validated.get('password'):
				return jsonify({'error' : 'При регистрации не указан логин и/или пароль'}) , 400
			
			validated['password_hash'] =\
			bcrypt.hashpw(validated['password'], bcrypt.gensalt(14))
			
			values = tuple(validated.values())
			db_columns = [User.DB_COLUMNS['columns'][field] for field in validated.keys()]

			
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
			pass
		except Error as e:
			self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
		