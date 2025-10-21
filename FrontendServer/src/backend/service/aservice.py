import mysql.connector
from mysql.connector import Error
from abc import ABC, abstractmethod
import json

class AService(ABC):
	def __init__(self,config_file:str):
		self.connection=None
		self.cursor=None
		
		with open(config_file, 'r', encoding='UTF-8') as file:
			config=json.load(file)
		
		self.host=config['host']
		self.user=config['user']
		self.password=config['password']
		self.database=config['database']


	def connect(self):
		self.connection=mysql.connector.connect(
			host=self.host,
			user=self.user,
			password=self.password,
			database=self.database,
			charset='utf8mb4',
			collation='utf8mb4_unicode_ci'
		)
		self.cursor=self.connection.cursor(dictionary=True)
	
	def disconnect(self):
		if self.connection:
			if self.connection.is_connected():
				self.cursor.close()
				self.connection.close()
				
	# Словарь со str ключами
	def remove_keys_uppercase(dict:dict)->dict:
		return {k.lower() : v for k, v in dict.items()}	
	# Список из словарей со str ключами
	def remove_keys_uppercase_in_dicts_list(list:list)->list:
		return [AService.remove_keys_uppercase(d) for d in list]
