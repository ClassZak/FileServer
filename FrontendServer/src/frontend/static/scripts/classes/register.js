document.addEventListener('DOMContentLoaded', function() {
	const registerForm = document.getElementById('register-form');
	if (!registerForm) return;

	registerForm.addEventListener('submit', function(e) {
		e.preventDefault();
		const formData = new FormData(this);

		fetch(this.action, {
			method: this.method,
			body: formData,
			headers: { 'X-CSRFToken': csrfToken }
		})
		.then(response => {
			// Если ответ - редирект (код 302)
			if (response.redirected) {
				window.location.href = response.url;
				return;
			}
			
			// Проверяем тип контента
			const contentType = response.headers.get('content-type');
			if (contentType){
				if(contentType.includes('text/html')) {
					return response.text().then(html => {
						// Заменяем текущую форму на новую (с сообщением об ошибке)
						const parser = new DOMParser();
						const newDoc = parser.parseFromString(html, 'text/html');
						const newForm = newDoc.getElementById('register-form');
						
						if (newForm) {
							registerForm.innerHTML = newForm.innerHTML;
						}
					});
				}else if(contentType.includes('application/json')){
					return response.json().then(json=>{
						if(json.error)
							throw new Error(json.error);
					});
				}
			}
			
			return response.text().then(text => {
				showError('Неожиданный ответ сервера');
			});
		})
		.catch(error => {
			console.error('Ошибка:', error);
			if(error.name && error.name == 'NetworkError')
				showError('Ошибка сети или сервера');
			else
				showError(error.message);
		});
	});
});