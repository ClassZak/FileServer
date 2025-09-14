// Требуется включить 
// FileServer/FrontendServer/src/frontend/static/scripts/read_data/load_groups.js и
// FileServer/FrontendServer/src/frontend/static/scripts/read_data/render_groups.js

addEventListener('DOMContentLoaded', async function(e){
	this.setTimeout(async function() {
		await loadGroups();
		renderGroups();
	}, 5)
});