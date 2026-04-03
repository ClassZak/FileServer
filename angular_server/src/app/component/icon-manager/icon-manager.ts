export class IconManager {
	public static getFileIcon(extension: string): string {
		return IconManager.icons[extension.toLowerCase()] || 'matfDocumentColored'; // Default icon
	}

	static icons: { [key: string]: string } = {
		pdf: 'matfPdfColored',
		txt: 'matfDocumentColored',
		doc: 'matfDocumentColored',
		docx: 'matfDocumentColored',
		xls: 'matfExcelColored',
		xlsx: 'matfExcelColored',
		ppt: 'matfPowerpointColored',
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
		rar: 'matfZipColored',
		'7z': 'matfZipColored',
		tar: 'matfZipColored',
		js: 'matfJavascriptColored',
		json: 'matfJsonColored',
		html: 'matfHtmlColored',
		css: 'matfCssColored',
		folder: 'matfFolderOpenColored'
	};
}