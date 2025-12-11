import React from 'react';
import '../styles/FileTable.css';

const FolderTable = ({ folders, navigateToFolder, prepareDelete }) => {
	const FolderRow = function (folder) {
		if (folder === null || folder === undefined)
			folder = {empty:true}

		return <tr key={folder.empty ? '-' : `folder-${folder.fullPath}`}>
			<td>
				<div className='flex'>
					<div>{folder.empty ? '' : '📁' }</div>
					<div>
						{folder.empty ? '-' : folder.name}
					</div>
				</div>
			</td>
			<td>{folder.empty ? '-' : folder.readableSize}</td>
			<td>{folder.empty ? '-' : (`${folder.itemCount || 0} элементов`)}</td>
			<td>{folder.empty ? '-' : (folder.modifiedDate || '-')}</td>
			<td>
				{folder.empty ? '-' :
						<div className="flex">
							<button
								onClick={() => navigateToFolder(folder.fullPath)}
								className="file-action-button file-action-button--download"
							>
								Открыть
							</button>
							<button
								onClick={() => prepareDelete(folder.fullPath, folder.name)}
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