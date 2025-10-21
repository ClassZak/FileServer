document.addEventListener('DOMContentLoaded', function() {
	const registerForm = document.getElementById('register-form');
	if (!registerForm) return;

	registerForm.addEventListener('submit', function(e) {
		e.preventDefault();
		hideError();
		
		const formData = new FormData(this);
		formData.append('csrf_token', csrfToken);

		fetch(this.action, {
			method: this.method,
			body: formData,
			headers: { 
				'X-CSRF-Token': csrfToken, 
				'X-Requested-With': 'XMLHttpRequest' 
			},
			credentials: 'include',
			mode: 'cors',
			// Для разработки с самоподписанными сертификатами
			// Это не рекомендуется для продакшена
			// referrerPolicy: 'unsafe-url'
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