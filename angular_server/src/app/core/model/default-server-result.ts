export class DefaultServiceResult {
	
	constructor (
		public error? : string,
		public message? : string,
		public success : boolean = false,
	) {
		if (error)
			this.success = false;
	}
}


export class DefaultServiceResultWithData<T> extends DefaultServiceResult {
	
	constructor (
		error? : string,
		message? : string,
		success : boolean = false,
		public data? :T
	) {
		super(error,message,success)
		this.data = data;
	}
}