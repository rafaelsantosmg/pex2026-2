import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './components/RequireRole';
import { AdminHome } from './pages/AdminHome';
import { CompanyHome } from './pages/CompanyHome';
import { LoginPage } from './pages/LoginPage';
import { StudentHome } from './pages/StudentHome';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/estudante"
        element={
          <RequireRole role="STUDENT">
            <StudentHome />
          </RequireRole>
        }
      />
      <Route
        path="/empresa"
        element={
          <RequireRole role="COMPANY">
            <CompanyHome />
          </RequireRole>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireRole role="ADMIN">
            <AdminHome />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
