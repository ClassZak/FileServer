from typing import Dict, Any
from flask import jsonify
from datetime import date

class ModelValidator:
	@staticmethod
	def validate(data: dict, model_meta: dict, cursor=None) -> dict:
		validated = {}
		for field, meta in model_meta.items():
			value = data.get(field)
			
			db_settings = meta.get('db_column', {})
			
			# Проверка обязательности
			if meta.get('required') and value in (None, ''):
				if not meta.get('default'):
					raise ValueError(f"Поле {field} обязательно")
				else:
					value=meta['default']
			
			# Преобразование типа
			if value is not None:
				try:
					if meta['type'] == date:
						value = date.fromisoformat(value)
					else:
						value = meta['type'](value)
				except:
					raise TypeError(f'Некорректный тип для {field}')
			else:
				continue
			
			# Валидация диапазонов
			if meta['type'] in (int, float):
				if 'min_value' in meta and value < meta['min_value']:
					raise ValueError(f"Значение {field} должно быть ≥ {meta['min_value']}")
				if 'max_value' in meta and value > meta['max_value']:
					raise ValueError(f"Значение {field} должно быть ≤ {meta['max_value']}")
			
			# Валидация строк
			if meta['type'] == str:
				if 'min_len' in meta and len(value) < meta['min_len']:
					raise ValueError(f"Длина {field} должна быть ≥ {meta['min_len']}")
				if 'max_len' in meta and len(value) > meta['max_len']:
					raise ValueError(f"Длина {field} должна быть ≤ {meta['max_len']}")
			
			# Проверка внешних ключей
			fk_info = db_settings.get('foreign_key')
			if fk_info and cursor:
				query = f"SELECT 1 FROM {fk_info['table']} WHERE {fk_info['column']} = %s"
				cursor.execute(query, (value,))
				if not cursor.fetchone():
					raise ValueError(f"Связанная запись в {fk_info['table']} не найдена")
			
			validated[field] = value
		return validated