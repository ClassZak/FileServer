class UpdatePasswordRequest{
	constructor(
		oldPassword,
		newPassword
	){
		this.oldPassword	= oldPassword || '';
		this.newPassword	= newPassword || '';
	}
}

export default UpdatePasswordRequest;