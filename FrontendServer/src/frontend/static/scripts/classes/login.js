document.addEventListener('DOMContentLoaded', function() {
	const loginForm = document.getElementById('login');
	if (!loginForm) return;

	loginForm.addEventListener('submit', function(e) {
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
			if (contentType && contentType.includes('text/html')) {
				return response.text().then(html => {
					// Заменяем текущую форму на новую (с сообщением об ошибке)
					const parser = new DOMParser();
					const newDoc = parser.parseFromString(html, 'text/html');
					const newForm = newDoc.getElementById('login');
					
					if (newForm) {
						loginForm.innerHTML = newForm.innerHTML;
					}
				});
			}
			
			return response.text().then(text => {
				console.error('Неожиданный тип ответа:', text);
				showError('Неожиданный ответ сервера');
			});
		})
		.catch(error => {
			console.error('Ошибка:', error);
			showError('Ошибка сети или сервера');
		});
	});
});