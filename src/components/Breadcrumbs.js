import React from 'react';

const Breadcrumbs = ({ currentPath, onNavigate }) => {
    if (!currentPath) return null;
    
    const parts = currentPath.split('/').filter(Boolean);
    
    return (
        <div className="flex items-center space-x-1 text-sm">
            <button
                onClick={() => onNavigate('')}
                className="text-blue-600 hover:text-blue-800"
                type="button"
            >
                Корень
            </button>
            
            {parts.map((part, index) => {
                const pathToHere = parts.slice(0, index + 1).join('/');
                const isLast = index === parts.length - 1;
                
                return (
                    <React.Fragment key={pathToHere}>
                        <span className="text-gray-400">/</span>
                        {isLast ? (
                            <span className="text-gray-800 font-medium">{part}</span>
                        ) : (
                            <button
                                onClick={() => onNavigate(pathToHere)}
                                className="text-blue-600 hover:text-blue-800"
                                type="button"
                            >
                                {part}
                            </button>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Breadcrumbs;