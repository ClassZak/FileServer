function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


class CreateModel_Group extends BaseModel{
	constructor(data = {}){
		super(data);
		this.name = data.name || '';
	}

	toJSON() {
		const json = super.toJSON();
		return json;
	}

	/**
	 * 
	 * @param {Объект класса CreateModel_Group} createModel_Group 
	 */
	static createGroup(createModel_Group) {
		hideError();

		const jwt = localStorage.getItem('access_token');
		if (!jwt) {
			/*catchError('Вы не авторизованы!');
			return;*/
		}

		
		fetch('/api/groups', {  // Изменили endpoint на /api/groups
			method: 'POST',
			body: JSON.stringify(createModel_Group.toJSON()),
			headers: { 
				'Content-Type': 'application/json',
				'X-Requested-With': 'XMLHttpRequest',
				'Authorization': `Bearer ${jwt}`,
				"X-CSRF-TOKEN": getCookie("csrf_access_token")
			},
			credentials: "include"
		})
		.then(async response => {
			if (response.redirected) {
				window.location.href = response.url;
				return;
			}
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Server error');
			}
			
			return response.json();
		})
		.then(data => {
			if (data && data.message) {
				console.log(data.message);
				showAlert('Группа успешно создана!');
			}
		})
		.catch(error => {
			catchError(error);
		});
	} 
}











