// components/FolderGrid.jsx
import React from 'react';

const FolderGrid = ({ folders, onNavigate, onDelete }) => {
    if (folders.length === 0) {
        return <p className="text-gray-500 italic">Папок нет</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map(folder => (
                <div key={folder.path} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <button
                            onClick={() => onNavigate(folder.path)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-left flex-1"
                            type="button"
                        >
                            <div className="flex items-center">
                                <span className="mr-2">📂</span>
                                <span className="truncate">{folder.name}</span>
                            </div>
                        </button>
                        <button
                            onClick={() => onDelete(folder.path, folder.name)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Удалить"
                            type="button"
                        >
                            🗑️
                        </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                            <span>Элементов:</span>
                            <span className="font-medium">{folder.itemCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Размер:</span>
                            <span className="font-medium">{folder.readableSize}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Изменен: {new Date(folder.lastModified).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FolderGrid;