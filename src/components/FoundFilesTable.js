import React from 'react';
import '../styles/FileTable.css';

const getFileIcon = (extension) => {
	const icons = {
		pdf: '📕',
		txt: '📝',
		doc: '📘', docx: '📘',
		xls: '📗', xlsx: '📗',
		ppt: '📙', pptx: '📙',
		jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', bmp: '🖼️',
		mp3: '🎵', wav: '🎵', ogg: '🎵',
		mp4: '🎬', avi: '🎬', mkv: '🎬',
		zip: '📦', rar: '📦', '7z': '📦', tar: '📦',
		js: '📜', json: '📜', html: '🌐', css: '🎨',
	};
	
	return icons[extension.toLowerCase()] || '📄';
};

function FileRow(onDownload, onDelete, searchPath, file) {
	if (file === null || file === undefined)
		console.log(file);
	
	const fileFullPath = file ?
	(file.fullPath || (searchPath ? `${searchPath}/${file.name}` : file.name)) : '';

	return <tr key={!file ? '-' : `file-${fileFullPath}`}>
		<td>
			<div className="flex items-center">
				<span className="mr-2 text-lg">
					{!file ? '' : getFileIcon(file.extension)}
				</span>
				<span className="font-medium truncate max-w-xs">
					{!file ? '-' : file.name}
				</span>
			</div>
		</td>
		<td>{!file ? '-' : file.fullPath}</td>
		<td>{!file ? '-' : file.readableSize}</td>
		<td>
			<span className="file-type-badge">
				{!file ? '-' : (file.extension || 'файл')}
			</span>
		</td>
		<td>
			{!file ? '-' : new Date(file.lastModified).toLocaleDateString()}
		</td>
		<td>
			{!file ? '-' :
				<div className="flex space-x-2">
					<button
						onClick={() => onDownload(fileFullPath, file.name)}
						className="file-action-button file-action-button--download"
						title="Скачать"
						type="button"
					>
						📥
					</button>
					<button
						onClick={() => onDelete(fileFullPath, file.name)}
						className="file-action-button file-action-button--delete"
						title="Удалить"
						type="button"
					>
						🗑️
					</button>
				</div>
			}
		</td>
	</tr>
};
const FoundFilesTable = ({ files, onDownload, onDelete, searchPath }) => {

	return (
		 <div>
			<h2 className="text-xl font-semibold mb-4 flex items-center">
				<span className="mr-2">📄</span> Файлы ({files.length})
			</h2>
			<div className="overflow-x-auto">
				<table className="file-table">
					<thead>
						<tr>
							<th>Имя</th>
							<th>Полный путь</th>
							<th>Размер</th>
							<th>Тип</th>
							<th>Изменен</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						{
							files && files.length ? (
							files.map(file => FileRow(onDownload, onDelete, searchPath, file))) :
							(FileRow())
						}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default FoundFilesTable;