// Требуется включить 
// scripts/data_scripts/read_data/load_groups.js
// scripts/data_scripts/render_data/render_groups.js
// scripts/JSClasses/Model/public/CreateModel/CreateModel_Group.js
// scripts/JSClasses/Model/public/BaseModel.js
// scripts/JSClasses/Model/FormWindow.js

addEventListener('DOMContentLoaded', async function(e){
	this.setTimeout(async function() {
		await loadGroups();
		renderGroups();
		DBFormFactory.createForm(CreateModel_Group, null, CreateModel_Group.createGroup); 
	}, 5)
});
