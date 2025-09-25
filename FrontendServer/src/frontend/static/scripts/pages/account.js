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

		let form = 
		DBFormFactory.createForm(CreateModel_Group, null, async function(createModel_Group) {
			CreateModel_Group.createGroup(createModel_Group); 	
			await loadGroups();
			renderGroups();
		}, CreateModel_Group.CREATE_MODEL_GROUP_LABELS_DICT );
		let overlay = 
		DBFormFactory.createOverlayForForm(form, 'Создание новой группы');
		
		overlay.style.display = 'flex';
		document.body.appendChild(overlay);
	}, 5)
});
