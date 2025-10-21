document.addEventListener('DOMContentLoaded', function() {
	const loginForm = document.getElementById('login-form');
	if (!loginForm) return;

	loginForm.addEventListener('submit', async function(e) {
		e.preventDefault();
		hideError();

		const formData = new FormData(this);
		formData.append('csrf_token', csrfToken);
		
		try {
			const resp = await fetch(this.action, {
				method: this.method,
				body: formData,
				headers: {
					'X-Requested-With': 'XMLHttpRequest'
				},
				credentials: 'same-origin'
			});

			if (resp.redirected)
				window.location.href = resp.url;
			const data = await resp.json();
			if (data.access_token)
				localStorage.setItem('access_token', data.access_token);

			if (!resp.ok) 
				throw new Error(data.error || 'Server error');
		}
		 catch (err) {
			catchError(err);
		}
	});
});
