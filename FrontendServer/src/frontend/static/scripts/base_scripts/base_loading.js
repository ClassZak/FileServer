var csrfToken = undefined;

document.addEventListener('DOMContentLoaded', function() {
	// CSRF токен
	csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
});


/**
 * Конвертирует данные формы в объект, опционально удаляя токен
 * @param {HTMLFormElement|FormData} source - Элемент формы или FormData
 * @param {boolean} [removeToken=true] - Удалять ли токен (по умолчанию true)
 * @param {string} [tokenField='csrf_token'] - Имя поля токена
 * @returns {Object} Объект с данными формы
 */
function getFormObject(source, removeToken = true, tokenField = 'csrf_token') {
	// Создаем FormData из источника
	const formData = source instanceof HTMLFormElement 
		? new FormData(source) 
		: source;

	// Конвертируем FormData в объект с поддержкой multi-value полей
	const result = {};
	for (const [key, value] of formData.entries()) {
		if (result[key] !== undefined) {
		// Если ключ уже существует, преобразуем в массив
		result[key] = Array.isArray(result[key]) 
			? [...result[key], value] 
			: [result[key], value];
		} else {
		result[key] = value;
		}
	}

	// Удаляем токен при необходимости
	if (removeToken && tokenField in result) {
		delete result[tokenField];
	}

	return result;
}