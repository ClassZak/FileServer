document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('login').addEventListener('submit', function(e) {
		e.preventDefault();
		const formData = new FormData(this);
		const nextUrl = this.querySelector('input[name="next_url"]')?.value || '/';

		fetch(this.action, {
			method: this.method,
			body: formData,
			headers: { 'X-CSRFToken': csrfToken }
		})
		.then(response => {
			const contentType = response.headers.get('content-type');
			
			if (contentType && contentType.includes('application/json')) {
				return response.json().then(data => ({ data, response }));
			}
			return response.text().then(text => ({ text, response }));
		})
		.then(({ data, text, response }) => {
			if (data) {
				// Обработка JSON ответа
				if (data.success && data.access_token) {
					// Сохраняем токен в localStorage
					localStorage.setItem('access_token', data.access_token);
					
					// Перенаправляем на защищенную страницу
					window.location.href = data.redirect || '/account';
				} else if (data.error) {
					throw new Error(data.error);
				} else {
					throw new Error('Неизвестная ошибка сервера');
				}
			} else {
				// Обработка не-JSON ответа
				throw {
					type: 'NON_JSON_RESPONSE',
					text: text,
					status: response.status
				};
			}
		})
		.catch(error => {
			if (error?.type === 'NON_JSON_RESPONSE') {
				const errorMessage = 
					`Сервер вернул не-JSON ответ (${error.status})\n` +
					`Текст ответа: ${error.text.substring(0, 200)}${error.text.length > 200 ? '...' : ''}`;
				
				console.error('Ошибка формата:', error);
				console.log('Полный текст ответа:', error.text);
				
				showError(errorMessage);
			} else {
				console.error('Ошибка авторизации:', error);
				showError(error.message || 'Ошибка при авторизации');
			}
		});
	});
});