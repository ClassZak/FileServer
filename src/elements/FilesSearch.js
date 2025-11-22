import React from "react"
import { Magnifyingglass } from '../assets/img';
import '../css_classes/image-button.css'

function FileSearch(){
	return (
		<form action="/api/files_search" method="GET" className="search-form" id = "files_search">
			<input
				name="q"
				className="item"
				placeholder="Поиск..."
				type="text"
				defaultValue=""
			></input>
			<button type="submit" className="image-button">
				<img alt="search" src={Magnifyingglass}></img>
			</button>
		</form>
	);
}

export default FileSearch;