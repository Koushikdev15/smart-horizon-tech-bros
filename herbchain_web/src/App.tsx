import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GlobalLayout from './layouts/GlobalLayout';
import Login from './features/auth/Login';
import DashboardRouter from './features/dashboard/DashboardRouter';
import ConsumerPortal from './features/consumer/ConsumerPortal';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:batchId" element={<ConsumerPortal />} />
        <Route path="/verify" element={<ConsumerPortal />} />

        {/* Protected routes */}
        <Route element={<GlobalLayout />}>
          <Route path="/" element={<DashboardRouter />} />
          <Route path="/app/*" element={<DashboardRouter />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
