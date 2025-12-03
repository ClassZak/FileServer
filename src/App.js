import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';
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
			<AuthProvider>
				<Router>
					<Routes>
						{/* Публичные маршруты */}
						<Route path="/" element={<HomePage />} />
						
						{/* Защищенные маршруты */}
						<Route path="/account" element={
							<ProtectedRoute>
								<AccountPage />
							</ProtectedRoute>
						} />
						
						{/* Другие защищенные маршруты */}
						<Route path="/admin/*" element={
							<ProtectedRoute>
								{/* Компонент админ-панели */}
							</ProtectedRoute>
						} />
						<Route path="/"			requireAuth={false} element={<HomePage />} />
						<Route path="/about"	requireAuth={false} element={<AboutPage/>} />
						<Route path="/login"	requireAuth={false} element={<LoginPage />} />
						<Route path="/files"	element={<FilesPage/>} />
						<Route path="/account"	element={<AccountPage/>} />
					</Routes>
				</Router>
			</AuthProvider>
		</div>
	);
}
