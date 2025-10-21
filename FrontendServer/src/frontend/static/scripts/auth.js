// Проверка аутентификации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
	const protectedRoutes = ['/account', '/dashboard']; // Добавьте свои защищенные пути
	
	if (protectedRoutes.some(route => window.location.pathname.includes(route))) {
		checkAuth();
	}
});

// Проверка JWT токена
function checkAuth() {
	const token = localStorage.getItem('access_token');
	
	if (!token) {
		redirectToLogin();
		return;
	}

	// Проверка валидности токена
	fetch('/api/verify_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	})
	.then(response => response.json())
	.then(data => {
		if (!data.valid) {
			redirectToLogin();
		}
	})
	.catch(() => redirectToLogin());
}

function redirectToLogin() {
	// Сохраняем текущий URL для перенаправления после логина
	const redirectUrl = encodeURIComponent(window.location.pathname);
	window.location.href = `/login?next_url=${redirectUrl}`;
}