var groups = null;

async function loadGroups(){
	hideError();

	await fetch('/api/groups/public')
	.then(async response=>{
		try{
			let data = response.json();
			return data;
		} catch(error){
			throw error;	
		}
	})
	.then(data => {
		groups = data['groups'];
	})
	.catch(error=>{
		catchError(error);
	})
}