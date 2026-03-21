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
