var groups = null;

async function loadGroups(){
	hideError();
	groups = [];

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
		if(data.error)
			throw new Error(data.error);
		groups = data['groups'];
	})
	.catch(error=>{
		catchError(error);
	})
}