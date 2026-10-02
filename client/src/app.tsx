import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import CategoryPage from './pages/Category/CategoryPage';
import ArticlePage from './pages/Article/ArticlePage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminRegistrations from './pages/Admin/Registrations';
import AdminUsers from './pages/Admin/Users';
import AdminArticles from './pages/Admin/Articles';
import AdminCreateArticle from './pages/Admin/CreateArticle';

const RoutesComponent = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="article/:id" element={<ArticlePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/create" element={<AdminCreateArticle />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
