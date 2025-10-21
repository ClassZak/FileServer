from datetime import datetime

from model.modelmeta import ModelMeta

class User(metaclass=ModelMeta):
	id = {
		'field_meta': {
			'type': int,
			'min_value': 1,
			'db_column': {
				'name': 'Id',
				'primary_key': True,
				'foreign_key': False
			}
		}
	}
	login = {
		'field_meta': {
			'type': str,
			'max_len': 64,
			'required': True,
			'db_column': {
				'name': 'Login'
			}
		}
	}
	password_hash = {
		'field_meta':{
			'type': str,
			'len': 60,
			'required': True,
			'db_column': {
				'name' : 'PasswordHash'
			}
		}
	}
	created_at = {
		'field_meta':{
			'type': datetime,
			'required': True,
			'db_column': {
				'name' : 'CreatedAt'
			}
		}
	}


class UserJSONModel(metaclass=ModelMeta):
	login = {
		'field_meta': {
			'type': str,
			'max_len': 64,
			'required': True
		}
	}
	password = {
		'field_meta':{
			'type': str,
			'max_len': 120,
			'required': True
		}
	}