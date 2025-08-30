document.addEventListener('DOMContentLoaded', function() {
	const loginForm = document.getElementById('login-form');
	if (!loginForm) return;

	loginForm.addEventListener('submit', function(e) {
		hideError();
		console.log(csrfToken);
		e.preventDefault();
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
			const contentType = response.headers.get('content-type');
			if (contentType){
				if(contentType.includes('text/html')) {
					return response.text().then(html => {
						// Заменяем текущую форму на новую (с сообщением об ошибке)
						const parser = new DOMParser();
						const newDoc = parser.parseFromString(html, 'text/html');
						const newForm = newDoc.getElementById('login-form');
						
						if (newForm) {
							loginForm.innerHTML = newForm.innerHTML;
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