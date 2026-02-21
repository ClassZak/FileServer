export class IconManager {
	public static getFileIcon(extension: string): string {
		return IconManager.icons[extension.toLowerCase()] || 'matfDocumentColored'; // общая иконка
	}

	static icons: { [key: string]: string } = {
		pdf: 'matfPdfColored',						// предположительно, если есть
		txt: 'matfDocumentColored',
		doc: 'matfDocumentColored',
		docx: 'matfDocumentColored',
		xls: 'matfExcelColored',					// или 'matfTableColored'
		xlsx: 'matfExcelColored',
		ppt: 'matfPowerpointColored',			// или 'matfPresentationColored'
		pptx: 'matfPowerpointColored',
		jpg: 'matfImageColored',
		jpeg: 'matfImageColored',
		png: 'matfImageColored',
		gif: 'matfImageColored',
		bmp: 'matfImageColored',
		mp3: 'matfAudioColored',
		wav: 'matfAudioColored',
		ogg: 'matfAudioColored',
		mp4: 'matfVideoColored',
		avi: 'matfVideoColored',
		mkv: 'matfVideoColored',
		zip: 'matfZipColored',
		rar: 'matfZipColored',						 // если отдельной нет
		'7z': 'matfZipColored',
		tar: 'matfZipColored',
		js: 'matfJavascriptColored',
		json: 'matfJsonColored',
		html: 'matfHtmlColored',
		css: 'matfCssColored',
		folder: 'matfFolderOpenColored'		 // или 'matfFolderColored'
	};
}