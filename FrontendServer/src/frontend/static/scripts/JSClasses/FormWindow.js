class DBFormFactory {
	static createForm(modelClass, container, onSubmit) {
		const form = document.createElement('form');
		form.className = 'db-form';
		
		// Получаем поля модели на основе её экземпляра
		const instance = new modelClass();
		const fields = Object.keys(instance).filter(key => key !== '_id');
		
		fields.forEach(field => {
			const fieldContainer = document.createElement('div');
			fieldContainer.className = 'form-field';
			
			const label = document.createElement('label');
			label.textContent = this.formatFieldName(field);
			label.htmlFor = field;
			
			const input = this.createInput(field, instance[field]);
			fieldContainer.appendChild(label);
			fieldContainer.appendChild(input);
			form.appendChild(fieldContainer);
		});
		
		const submitButton = document.createElement('button');
		submitButton.type = 'submit';
		submitButton.textContent = 'Сохранить';
		form.appendChild(submitButton);
		
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const formData = new FormData(form);
			const data = {};
			
			fields.forEach(field => {
				data[field] = formData.get(field);
			});
			
			onSubmit(new modelClass(data));
		});
		
		if(container !== null && container !== undefined)
			container.appendChild(form);
		else
			document.body.appendChild(form);

		return form;
	}
	
	static createInput(fieldName, defaultValue) {
		const input = document.createElement('input');
		input.id = fieldName;
		input.name = fieldName;
		input.value = defaultValue || '';
		
		// Специальная обработка для разных типов полей
		if (fieldName.includes('password')) {
			input.type = 'password';
		} else if (fieldName.includes('email')) {
			input.type = 'email';
		} else if (fieldName === 'mode') {
			input.type = 'number';
			input.min = 0;
			input.max = 0o777;
		} else if (fieldName === 'size') {
			input.type = 'number';
		} else if (fieldName === 'isPublic') {
			const select = document.createElement('select');
			select.id = fieldName;
			select.name = fieldName;
			
			const optionYes = document.createElement('option');
			optionYes.value = 'true';
			optionYes.textContent = 'Да';
			
			const optionNo = document.createElement('option');
			optionNo.value = 'false';
			optionNo.textContent = 'Нет';
			optionNo.selected = true;
			
			select.appendChild(optionYes);
			select.appendChild(optionNo);
			return select;
		}
		
		return input;
	}
	
	static formatFieldName(fieldName) {
		return fieldName
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, str => str.toUpperCase())
			.replace(/Id(\w)/g, 'ID $1');
	}
}