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

		const token = localStorage.getItem('access_token');

		console.log(csrfToken);

		fetch('/api/groups/public', {
			method: 'POST',
			body: JSON.stringify(createModel_Group.toJSON()),  // Преобразуйте в JSON строку
			headers: { 
				'X-CSRF-Token': csrfToken,
				'Content-Type': 'application/json',  // Добавьте Content-Type
				'X-Requested-With': 'XMLHttpRequest'
			},
			credentials: 'include'
		})
		.then(async response => {
			// Если ответ - редирект (код 302)
			if (response.redirected) {
				window.location.href = response.url;
				return;
			}
			try{
				let data = response.json();
				return data;
			} catch(error){
				throw error;	
			}
		})
		.then(data=>{
			if(data && data.message)
				console.log(data.message);
		})
		.catch(error => {
			catchError(error);
		});
	} 
}