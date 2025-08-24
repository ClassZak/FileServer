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
			try{
				const contentType = response.headers.get('content-type');
				if (contentType){
					if(contentType.includes('text/html')) {
						return response.text().then(html => {
						throw new Error(html);
					});
					}else if(contentType.includes('application/json')){
						return response.json().then(json=>{
							if(json.error)
								throw new Error(json.error);
							else if (json.message){
								console.log(json.message);
								this.reset();
								showAlert('Вы успешно зарегистрировались!');
							}
						});
					}
				}
			}
			catch (error){
				throw error;
			}
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