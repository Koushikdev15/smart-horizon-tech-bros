import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GlobalLayout from './layouts/GlobalLayout';
import Login from './features/auth/Login';
import Unauthorized from './features/auth/Unauthorized';
import DashboardRouter from './features/dashboard/DashboardRouter';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes — every in-app page lives under /app/:pageId so that
            role permissions can be enforced against the URL itself (direct links,
            bookmarks, browser back/forward all go through the same guard). */}
        <Route element={<GlobalLayout />}>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/:pageId" element={<DashboardRouter />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
