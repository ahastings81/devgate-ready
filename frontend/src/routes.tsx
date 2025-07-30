import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import TimeEntries from './pages/TimeEntries';
import Services from './pages/Services';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';  // ← make sure this file exists

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Public */}
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Protected */}
    <Route
      path="/dashboard"
      element={
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      }
    />

    <Route
      path="/clients"
      element={
        <RequireAuth>
          <Clients />
        </RequireAuth>
      }
    />

    <Route
      path="/projects"
      element={
        <RequireAuth>
          <Projects />
        </RequireAuth>
      }
    />

    <Route
      path="/time-entries"
      element={
        <RequireAuth>
          <TimeEntries />
        </RequireAuth>
      }
    />

    <Route
      path="/services"
      element={
        <RequireAuth>
          <Services />
        </RequireAuth>
      }
    />

    <Route
      path="/invoices"
      element={
        <RequireAuth>
          <Invoices />
        </RequireAuth>
      }
    />
    <Route
      path="/invoices/new"
      element={
        <RequireAuth>
          <Invoices />
        </RequireAuth>
      }
    />

    {/* ← This is the new detail route */}
    <Route
      path="/invoices/:id"
      element={
        <RequireAuth>
          <InvoiceDetail />
        </RequireAuth>
      }
    />

    {/* Catch‑all: keep this last */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
