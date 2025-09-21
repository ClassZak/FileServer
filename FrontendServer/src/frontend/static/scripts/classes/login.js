/*document.addEventListener('DOMContentLoaded', function() {
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
		.then(async response => {
			try{
				let data = response.json();
				return data;
			} catch(error){
				throw error;
			}
		})
		.then(data=>{
			if(data.error)
				throw new Error(data.error);

			localStorage.setItem("access_token", data.access_token);
			if (data.redirect)
				window.location.href = data.redirect;
		})
		.catch(error => {
			catchError(error);
		});
	});
});
*/


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
          'X-Requested-With': 'XMLHttpRequest' // чтобы сервер понял, что это AJAX
        },
        credentials: 'same-origin' // если у тебя есть сессионные куки CSRF
      });

		if (resp.redirected)
		window.location.href = resp.url;
	const data = await resp.json();
	if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }

      if (!resp.ok) 
        throw new Error(data.error || 'Server error');
      

      // Сохраняем токен в localStorage
      
    } catch (err) {
      catchError(err);
    }
  });
});
