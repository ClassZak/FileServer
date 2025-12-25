import React from 'react';
import './MainContent.css';

function MainContent({children}){
	return (
		<main className="MainContent">
			{children}
		</main>
	);
}

export default MainContent;