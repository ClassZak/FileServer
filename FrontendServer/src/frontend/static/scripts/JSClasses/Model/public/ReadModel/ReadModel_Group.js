class ReadModel_Group extends BaseModel{
	constructor(data = {}){
		super(data);
		this.name =		data.name		|| '';
		this.leader =	data.leader		|| '';
		this.isLeader =	data.isLeader	|| '';
	}

	toJSON() {
		const json = super.toJSON();
		return json;
	}

	static CREATE_MODEL_GROUP_LABELS_DICT = {
		'name': 'Название'
	};
}
