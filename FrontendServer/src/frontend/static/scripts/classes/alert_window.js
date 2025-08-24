var alertWindow;
var alertWindowObject = {
	htmlElement : alertWindow
}



function hideAlert(){
	alertWindow.style.visibility='collapse';
}
function showAlert(alert){
	alertWindow.style.visibility='visible';
	/*Экранирование не требуется, т.к. устанавливается textContent*/
	if(alert === undefined || alert === null)
		alert = 'Неизвестное сообщение';
	document.getElementById('alert-message').textContent=alert;
}


function createAlertNotification(){
	alertWindow = document.createElement('div');
	alertWindow.style.visibility = 'collapse';
	alertWindow.classList.add('alert-window');
	
	alertWindow.innerHTML = `
		<div class="alert-window-text-content">
			<h2 class="alert-window-inline-element" id="alert-message"></h2>
		</div>
		<div >
			<button
				class="square-btn alert-window-square-btn"
				onclick="hideAlert()" style = "">
				X
			</button>
		</div>
	`;

	document.body.append(alertWindow);
}
document.addEventListener('DOMContentLoaded', createAlertNotification);