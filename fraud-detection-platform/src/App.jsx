import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoutes';

import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import FraudAlerts from './pages/FraudAlerts';
import ReportFraud from './pages/ReportFraud';
import MyReports from './pages/MyReports';
import FraudSimulator from './pages/FraudSimulator';
import Profile from './pages/Profile';

import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import InvestigationCenter from './pages/InvestigationCenter';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* USER Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/transactions/:id"
            element={
              <ProtectedRoute>
                <TransactionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/alerts"
            element={
              <ProtectedRoute>
                <FraudAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/report-fraud"
            element={
              <ProtectedRoute>
                <ReportFraud />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ADMIN Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/investigations"
            element={
              <AdminRoute>
                <InvestigationCenter />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/simulator"
            element={
              <AdminRoute>
                <FraudSimulator />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <Profile />
              </AdminRoute>
            }
          />

          {/* Backward compatibility redirects */}
          <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
          <Route path="/transactions" element={<Navigate to="/user/transactions" replace />} />
          <Route path="/transactions/:id" element={<Navigate to="/user/transactions/:id" replace />} />
          <Route path="/alerts" element={<Navigate to="/user/alerts" replace />} />
          <Route path="/reports" element={<Navigate to="/user/reports" replace />} />
          <Route path="/report-fraud" element={<Navigate to="/user/report-fraud" replace />} />
          <Route path="/simulator" element={<Navigate to="/admin/simulator" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;