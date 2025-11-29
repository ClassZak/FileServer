/*import React from 'react';

function App() {
	return (
		<div className="App">
		</div>
	);
}

export default App;
*/
/*
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      {}
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/about">О нас</Link>
        <Link to="/login">Вход</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        {}
      </Routes>
    </Router>
  );
}

export default App;*/

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import Header from "./parts/Header";
import FilesPage from './pages/FilesPage'

function Container({ children }) {
	return <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>;
}






function NotFound() {
return (
<Container>
<h1 className="text-2xl font-bold">404 — Страница не найдена</h1>
<Link to="/" className="text-blue-600 underline mt-4 block">На главную</Link>
</Container>
);
}


export default function App() {
	return (
		<div>
			<Header />
			<Router>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/account" element={<AccountPage/>} />
					<Route path="/about" element={<AboutPage />} />
					<Route path="/files" element={<FilesPage />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</Router>
			{/* <header>
				<div className="header-content">
				<nav>
					<a href="/">Главная</a>
					<a href="/files">Файлы</a>
					<a href="/about">О проекте</a>
					<a href="/account">Аккаунт</a>
				</nav>
				<FileSearch />
				</div>
			</header> */}
		</div>
	);
}