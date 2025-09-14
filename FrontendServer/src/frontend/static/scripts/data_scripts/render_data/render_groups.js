// Требуется включить FileServer/FrontendServer/src/frontend/static/scripts/read_data/load_groups.js

function renderGroups(){
	if(groups === null || groups === undefined)
		return;

	const tbody = document.querySelector('#group-table tbody');

	tbody.innerHTML='';

	groups.forEach(element => {
		let tr = document.createElement('tr');
		let tds = [];
		tds.push(document.createElement('td'));
		tds.push(document.createElement('td'));

		tds[0].textContent = element.name;
		tds[1].textContent = element.leader;

		tds.forEach(td => {
			tr.appendChild(td);
		});

		tbody.appendChild(tr);
	});
}