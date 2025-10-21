from sqlite3 import IntegrityError
from typing import Tuple, Union
import mysql.connector
from flask import Response, jsonify, request, Flask
from mysql.connector import Error
import base64

from model.user import User, UserJSONModel
from service.aservice import AService
from service.groupservice import GroupService
from service.userservice import UserService
from validators.modelvalidator import ModelValidator
from model.group import Group, PublicGroup

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

class PublicGroupService(GroupService):
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
		return super().create_group(data)
	def read_groups_by_user_id(self, id:int):
		try:
			self.connect()

			# HANDLE COLUMNS MANAGMENT!
			query = f"""
				SELECT DISTINCT
					g.`{PublicGroup.DB_COLUMNS['columns']['name']}`	AS 'name', 
					u.{User.DB_COLUMNS['columns']['login']}			AS 'leader'
				FROM GroupMember gm
				JOIN `{GroupService.TABLE_NAME}` g
				LEFT JOIN `{UserService.TABLE_NAME}` u ON
					u.{User.DB_COLUMNS['columns']['id']} = g.{Group.DB_COLUMNS['columns']['id_leader']}
				LEFT JOIN `{UserService.TABLE_NAME}` u2 ON
					u2.{User.DB_COLUMNS['columns']['id']} = gm.IdUser
				WHERE u.Id = %s OR u2.Id = %s
			"""
			self.cursor.execute(query, tuple([id, id]))
			
			raw_data = self.cursor.fetchall()
			
			# Преобразуем данные БД в формат модели
			return jsonify({'groups': raw_data}), 200
		except Error as e:
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		except IntegrityError as e:
			self.connection.rollback()
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	def read_groups_by_leader_id(self, id: int):
		try:
			self.connect()

			# HANDLE COLUMNS MANAGMENT!
			self.cursor.execute(f"""
				SELECT 
					g.`{PublicGroup.DB_COLUMNS['columns']['name']}`	AS 'name', 
					u.{User.DB_COLUMNS['columns']['login']}			AS 'leader'
				FROM GroupMember gm
				JOIN `{GroupService.TABLE_NAME}` g
				LEFT JOIN `{UserService.TABLE_NAME}` u ON
					u.{User.DB_COLUMNS['columns']['id']} = g.{Group.DB_COLUMNS['columns']['id_leader']}
				WHERE u.Id = %s
			""", (id, ))
			raw_data = self.cursor.fetchall()
			
			# Преобразуем данные БД в формат модели
			return jsonify({'groups': raw_data}), 200
		except Error as e:
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	def read_groups_by_member_id(self, id: int):
		try:
			self.connect()

			# HANDLE COLUMNS MANAGMENT!
			self.cursor.execute(f"""
				SELECT 
					g.`{PublicGroup.DB_COLUMNS['columns']['name']}`	AS 'name', 
					u.{User.DB_COLUMNS['columns']['login']}			AS 'leader'
				FROM GroupMember gm
				JOIN `{GroupService.TABLE_NAME}` g
				LEFT JOIN `{UserService.TABLE_NAME}` u ON
					u.{User.DB_COLUMNS['columns']['id']} = gm.IdUser
				WHERE u.Id = %s
			""", (id, ))
			raw_data = self.cursor.fetchall()
			
			# Преобразуем данные БД в формат модели
			return jsonify({'groups': raw_data}), 200
		except Error as e:
			return jsonify({'error' : f'Ошибка БД: {str(e)}'}), 500
		finally:
			self.disconnect()
	#TODO: добавить проверку на ссылки на группу
	def delete_group(self, id:int):
		return super().delete_group(id)
	"""
		CRUD операции
	"""




	"""
		Простые методы
	"""
	def sql_data_to_json_list(self, data:dict):
		return super().sql_data_to_json_list(data)
	def exists(self, id : int) -> bool:
		return super().exists(id)
	def exists_name(self, name:str) -> bool:
		return super().exists_name(name)
	"""
		Простые методы
	"""