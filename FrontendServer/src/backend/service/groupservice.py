from sqlite3 import IntegrityError
from typing import Tuple, Union
import mysql.connector
from flask import Response, jsonify, request, Flask
from mysql.connector import Error
import base64

from service.aservice import AService
from validators.modelvalidator import ModelValidator
from model.group import Group

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

class GroupService(AService):
	TABLE_NAME = 'Group'
	def __init__(self, config_file:str):
		super().__init__(config_file)

	"""
	CREATE TABLE `Group` (
		Id			INT AUTO_INCREMENT PRIMARY KEY,
		`Name`		NVARCHAR(64) UNIQUE NOT NULL,
		IdLeader	INT NOT NULL,
		FOREIGN KEY (IdLeader) REFERENCES `User`(Id)
	);
	"""

	"""
		CRUD операции
	"""
	def create_group(self, data:dict) -> Tuple[Response, int]:
		try:
			validated = ModelValidator.validate(data, Group.FIELDS_META)
			if self.exists_name(validated.get('name')):
				return jsonify({'error' : 'Такая группа уже существует'}), 400
			values = tuple(validated.values())
			db_columns = [Group.DB_COLUMNS['columns'][field] for field in validated.keys()]

			query = f"""
				INSERT INTO `{GroupService.TABLE_NAME}` ({','.join(db_columns)})
				VALUES ({','.join(['%s'] * len(values)) })
			"""

			self.connect()
			self.cursor.execute(query, values)
			self.connection.commit()

			return jsonify({'message':'Новая группа успешно создана'}), 201

		except ValueError as e:
			return jsonify({'error' : str(e)}), 400
		except IntegrityError as e:
			self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		except Error as e:
			try:
				if self.connection:
					self.connection.rollback()
			except Error as e:
				return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
			finally:
				return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	def read_groups(self):
		try:
			self.connect()

			columns = [Group.DB_COLUMNS['columns'][field] 
				for field in Group.FIELDS_META.keys()]
			self.cursor.execute(f"SELECT {','.join(columns)} FROM `{GroupService.TABLE_NAME}`")
			raw_data = self.cursor.fetchall()
			
			# Преобразуем данные БД в формат модели
			return jsonify({'groups': [{
					field: str(row[Group.DB_COLUMNS['columns'][field]])
					for field in Group.FIELDS_META.keys()
				}
				for row in raw_data
			]}), 200
		except Error as e:
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	def update_group(self, data:dict, id: int) -> Tuple[Response, int]:
		try:
			# Проверка конфликта ID
			if 'id' in data and data['id'] != data:
				return jsonify({'error': 'ID в теле запроса не совпадает с ID в URL'}), 400
			
			data['id'] = id
			# Проверка ID и валидация
			if not self.exists(data['id']):
				return jsonify({'error': 'Объект для обновления данных не найден'}), 404
			validated = ModelValidator.validate(data, Group.FIELDS_META, self.cursor)

			set_clause = ', '.join([
				f"{Group.DB_COLUMNS['columns'][field]} = %s"
				for field in validated if field != 'id'
			])
			values = [validated[field] for field in validated if field != 'id']
			values.append(data['id'])

			query = f"""
				UPDATE `{GroupService.TABLE_NAME}`
				SET {set_clause}
				WHERE {Group.DB_COLUMNS['columns']['id']} = %s
			"""

			self.connect()
			self.cursor.execute(query, values)
			self.connection.commit()

			if self.cursor.rowcount == 0:
				return jsonify({'error': 'Объект уже имеет эти данные'}), 400
		
			return jsonify({'message': 'Данные объекта обновлены'}), 200
		except ValueError as e:
			return jsonify({'error': str(e)}), 400
		except Error as e:
			self.connection.rollback()
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()	
	#TODO: добавить проверку на ссылки
	def delete_group(self, id:int):
		try:
			if not self.exists(id):
				return jsonify({'error': 'Объект для удаления не найден'}), 404
			
			self.connect()
			query = f"""
				DELETE FROM `{GroupService.TABLE_NAME}`
				WHERE {Group.DB_COLUMNS['columns']['id']} = %s
			"""
			self.cursor.execute(query, (id,))
			self.connection.commit()
			return jsonify({'message': 'Объект успешно удалён'}), 200
		except Error as e:
			self.connection.rollback()
			return jsonify({'error': f'Ошибка БД: {str(e)}'}), 500
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
			data[Group.DB_COLUMNS['columns'][field]]) for field in Group.FIELDS_META.keys()}
	def exists(self, id : int) -> bool:
		try:
			self.connect()
			query = f"""
				SELECT EXISTS(SELECT 1 FROM `{GroupService.TABLE_NAME}`
				WHERE {Group.DB_COLUMNS['columns']['id']} = %s) AS exist
			"""
			self.cursor.execute(query, (id,))
			result = self.cursor.fetchone()
			return bool(result['exist']) if result else False
		finally:
			self.disconnect()
	def exists_name(self, name:str) -> bool:
		try:
			self.connect()
			query = f"""
				SELECT EXISTS(SELECT 1 FROM `{GroupService.TABLE_NAME}`
				WHERE {Group.DB_COLUMNS['columns']['name']} = %s) AS exist
			"""
			self.cursor.execute(query, (name,))
			result = self.cursor.fetchone()
			return bool(result['exist']) if result else False
		finally:
			self.disconnect()
	"""
		Простые методы
	"""