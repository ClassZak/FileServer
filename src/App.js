import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import Header from "./parts/Header";
import Footer from './parts/Footer';
import FilesPage from './pages/FilesPage';

function Container({ children }) {
	return <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>;
}

function NotFound() {
	return (
		<Container>
			<h1 className="text-2xl font-bold">404 — Страница не найдена</h1>
			<p className="mt-2">Такой страницы не существует.</p>
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
						<Route path="/about" element={<AboutPage />} />
						<Route path="/login" element={<LoginPage />} />
						
						{/* Защищенные маршруты */}
						<Route path="/account" element={
							<ProtectedRoute>
								<AccountPage />
							</ProtectedRoute>
						} />
						
						<Route path="/files*" element={
							<ProtectedRoute>
								<FilesPage />
							</ProtectedRoute>
						} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</Router>
			</AuthProvider>
			<Footer />
		</div>
	);
}