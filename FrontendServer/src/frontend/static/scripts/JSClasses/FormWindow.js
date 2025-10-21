// Требуется включить 
// styles/classes/modal.css
// styles/classes/model_form.css
// styles/classes/overlay.css

class DBForm{
	static OverlayDBForms = [];
	constructor(name = '', formRef){
		this.name = name;
		this.formRef = formRef;
	}

	

	static openForm(name = ''){
		const formRef = DBForm.findForm(name);

		formRef.parentElement.parentElement.style.display = 'flex';
		document.body.classList.add('no-scroll');
	}

	
	static closeForm(name = ''){
		const formRef = DBForm.findForm(name);

		formRef.parentElement.parentElement.style.display = 'none';
		document.body.classList.remove('no-scroll');
	}


	static findForm(name = ''){
		const form = DBForm.OverlayDBForms.find(f=>f.name == name);
		if(!form)
			throw new Error('Не найдена форма для открытия');

		const formRef = form.formRef;
		if(
			!formRef.parentElement ||
			!formRef.parentElement.classList.contains('model-form') ||
			!formRef.parentElement.parentElement ||
			!formRef.parentElement.parentElement.classList.contains('overlay')
		)
			throw new Error('Сохранена неверная форма');

		return formRef;
	}
}




class DBFormFactory {
	static createForm(name, modelClass, container, label_dict = undefined, id = undefined) {
		const form = document.createElement('form');
		form.setAttribute('name', name);
		if(id)
			form.setAttribute('id', id);
		form.className = 'db-form';

		{
			let csrfInput = this.createInput('csrf_token', csrfToken);
			csrfInput.setAttribute('type','hidden');
			form.appendChild(csrfInput);
		}
		// Получаем поля модели на основе её экземпляра
		const instance = new modelClass();
		const fields = DBFormFactory.getModelFields(modelClass);
		
		fields.forEach(field => {
			const fieldContainer = document.createElement('div');
			fieldContainer.className = 'form-field';
			
			const label = document.createElement('label');
			let formatedName = this.formatFieldName(field);
			if(label_dict && label_dict.hasOwnProperty(formatedName))
				formatedName = label_dict[formatedName];
			label.textContent = formatedName
			label.htmlFor = field;
			
			const input = this.createInput(field, instance[field]);
			fieldContainer.appendChild(label);
			fieldContainer.appendChild(input);
			form.appendChild(fieldContainer);
		});
		
		if(container !== null && container !== undefined)
			container.appendChild(form);
		else
			document.body.appendChild(form);


		DBForm.OverlayDBForms.push(new DBForm(name, form));

		return form;
	}

	static addSubmitButtonForOverlayForm(form, onSubmit, modelClass, buttonText){
		const submitButton = document.createElement('button');
		submitButton.type = 'submit';
		submitButton.textContent = buttonText;

		const fields = DBFormFactory.getModelFields(modelClass);

		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const formData = new FormData(form);
			const data = {};
			
			fields.forEach(field => {
				data[field] = formData.get(field);
			});
			
			onSubmit(new modelClass(data));

			const overlay = form.parentElement.parentElement;
			overlay.style.display = 'none';
			document.body.classList.remove('no-scroll');
		});

		form.appendChild(submitButton);

		return submitButton;
	}

	static getModelFields(modelClass){
		const instance = new modelClass();
		const fields = Object.keys(instance).filter(key => key !== '_id');

		return fields;
	}
	
	static createInput(fieldName, defaultValue) {
		const input = document.createElement('input');
		input.id = fieldName;
		input.name = fieldName;
		input.value = defaultValue || '';
		input.type = 'text'
		
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
			.replace(/Id(\w)/g, 'ID $1');
	}

	static createOverlayForForm(form, formHeader){
		let overlay, modelForm, header;

		overlay	=	document.createElement('div');
		overlay.	classList.add('overlay');
		modelForm =	document.createElement('div');
		modelForm.	classList.add('model-form');

		header = document.createElement('h1');
		header.textContent = formHeader;

		modelForm.appendChild(header);
		modelForm.appendChild(form);

		overlay.appendChild(modelForm);

		document.body.append(overlay);

		return overlay;
	}

	static addCanselButtonForOverlayForm(form){
		let button	= document.createElement('button')
		button.type	= 'reset';
		button.textContent = 'Отмена';

		
		if(
			form.parentElement && 
			form.parentElement.classList.contains('model-form') &&
			form.parentElement.parentElement &&
			form.parentElement.parentElement.classList.contains('overlay')&&

			form.hasAttribute('name')
		)
			button.addEventListener('click', function(e){
				form.reset();

				const overlay = form.parentElement.parentElement;

				DBForm.closeForm(form.getAttribute('name'))
			});
		else
			button.addEventListener('click', function(){
				form.reset();
			});


		form.append(button);
	}
}



