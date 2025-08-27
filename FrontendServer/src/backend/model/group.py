from model.modelmeta import ModelMeta

class Group(metaclass=ModelMeta):
	id = {
		'field_meta':{
			'type': int,
			'min_value': 1,
			'db_column': {
				'name' : 'Id',
				'primary_key' : True,
				'foreign_key' : False,
			}
		}
	}
	name = {
		'field_meta':{
			'type': str,
			'max_len': 64,
			'required': True,
			'db_column': {
				'name' : 'Name'
			}
		}
	}
	leader_id = {
		'field_meta':{
			'type': int,
			'required': True,
			'db_column': {
				'name' : 'LeaderId'
			}
		}
	}