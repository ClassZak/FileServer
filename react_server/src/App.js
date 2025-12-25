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
import './App.css'; // Создадим этот файл
import UsersPage from './pages/UsersPage';
import UserPage from './pages/UserPage';
import GroupsPage from './pages/GroupsPage';
import GroupPage from './pages/GroupPage';


function App() {
	return (
		<div className="app-container">
			<AuthProvider>
				<Router>
					<Header />
					<main className="main-wrapper">
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/about" element={<AboutPage />} />
							<Route path="/login" element={<LoginPage />} />
							
							<Route path="/account" element={
								<ProtectedRoute>
									<AccountPage />
								</ProtectedRoute>
							} />

							<Route path='/users' element={
								<ProtectedRoute>
									<UsersPage />
								</ProtectedRoute>
							} />

							<Route path='/user/*' element={
								<ProtectedRoute>
									<UserPage />
								</ProtectedRoute>
							} />
							

							<Route path='/groups' element={
								<ProtectedRoute>
									<GroupsPage />
								</ProtectedRoute>
							} />

							<Route path='/group/*' element={
								<ProtectedRoute>
									<GroupPage />
								</ProtectedRoute>
							} />


							<Route path="/files/*" element={
								<ProtectedRoute>
									<FilesPage />
								</ProtectedRoute>
							} />
							
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</main>
					<Footer />
				</Router>
			</AuthProvider>
		</div>
	);
}

export default App;