// components/FolderTable.jsx
import React from 'react';
import '../styles/FileTable.css';

const getFolderIcon = (extension) => {
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

const FolderTable = ({ folders, navigateToFolder, prepareDelete }) => {
	const FolderRow = function (folder) {
		if (folder === null || folder === undefined)
			folder = {empty:true}

		return <tr key={folder.empty ? '-' : folder.path}>
			<td>
				<div 
					className="flex items-center cursor-pointer hover:text-blue-400"
					onClick={folder.empty ? ()=>{} : () => navigateToFolder(folder.path)}
				>
					<div className="mr-3 text-xl">{folder.empty ? '' : '📁' }</div>
					<div className="font-medium">
						{folder.empty ? '-' : folder.name}
					</div>
				</div>
			</td>
			<td>{folder.empty ? '-' : folder.readableSize}</td>
			<td>{folder.empty ? '-' : (`${folder.itemCount || 0} элементов`)}</td>
			<td>{folder.empty ? '-' : (folder.modifiedDate || '-')}</td>
			<td>
				{folder.empty ? '-' :
						<div className="flex space-x-2">
							<button
								onClick={() => navigateToFolder(folder.path)}
								className="file-action-button file-action-button--download"
								>
								Открыть
							</button>
							<button
								onClick={() => prepareDelete(folder.path, folder.name)}
								className="file-action-button file-action-button--delete"
								>
								Удалить
							</button>
						</div>
				}
			</td>
		</tr>
	};

	return (
		<div className="mb-8">
			<h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">📁</span> Папки ({folders.length})
            </h2>
			<table className="file-table">
				<thead>
					<tr>
						<th>Имя папки</th>
						<th>Размер</th>
						<th>Элементов</th>
						<th>Дата изменения</th>
						<th>Действия</th>
					</tr>
				</thead>
				<tbody>
					{
						folders.length ? 
						folders.map(folder => FolderRow(folder)) :
						FolderRow()
					}
				</tbody>
			</table>
		</div>
	);
};

export default FolderTable;