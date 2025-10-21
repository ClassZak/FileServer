function logout(){
	fetch('/api/logout')
	.then(response =>{
		if(response.redirected){
			window.location.href = response.url;
			return;
		}
	})
	.catch(error=> {
		console.error('Ошибка:', error);
		showError(error)
	});
}