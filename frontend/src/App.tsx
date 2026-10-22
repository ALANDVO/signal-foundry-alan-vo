import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { AccountsPage } from './pages/AccountsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ToastProvider } from './components/Toast';
export const App: React.FC = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
};