import React from "react";
import FileSearch from "../elements/FilesSearch";
import './header.css'

function Header(){
	return(
		<header>
			<div className="header-content">
			<nav>
				<a href="/">Главная</a>
				<a href="/api/files_search">Файлы</a>
				<a href="/about">О проекте</a>
				<a href="/account">Аккаунт</a>
			</nav>
				<FileSearch />
			</div>
		</header>
	);
}

export default Header;