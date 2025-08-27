class ModelMeta(type):
	def __new__(cls, name, bases, dct):
		fields_meta = {}
		db_columns = {
			'columns': {},
			'primary_keys': [],
			'foreign_keys': {}
		}

		for attr_name, attr_value in dct.items():
			if isinstance(attr_value, dict) and 'field_meta' in attr_value:
				meta = attr_value['field_meta']
				fields_meta[attr_name] = meta
				
				# Обработка db_column
				db_settings = meta.get('db_column', {'name': attr_name})
				column_name = db_settings['name']
				
				# Сохраняем информацию о столбцах
				db_columns['columns'][attr_name] = column_name
				
				# Обработка первичных ключей
				if db_settings.get('primary_key', False):
					db_columns['primary_keys'].append(attr_name)
				
				# Обработка внешних ключей
				if 'foreign_key' in db_settings:
					db_columns['foreign_keys'][attr_name] = db_settings['foreign_key']

		dct['FIELDS_META'] = fields_meta
		dct['DB_COLUMNS'] = db_columns
		return super().__new__(cls, name, bases, dct)