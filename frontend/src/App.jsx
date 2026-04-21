import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Attendance from './pages/Attendance';
import FuelLogs from './pages/FuelLogs';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import CustomerLayout from './components/CustomerLayout';
import Home from './pages/Home';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerProfile from './pages/CustomerProfile';
import Booking from './pages/Booking';
import BookingDetails from './pages/BookingDetails';
import TrackingPage from './pages/TrackingPage';
import AdminBookings from './pages/AdminBookings';
import TripPlaybackPage from './pages/TripPlaybackPage';
import OptimizationReports from './pages/OptimizationReports';

const ProtectedRoute = ({ children, adminOnly = false, customerOnly = false }) => {
  const { user, loading, isAdmin, isCustomer } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />;
  if (customerOnly && !isCustomer()) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user, isAdmin, isCustomer } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? (isAdmin() ? <Navigate to="/dashboard" replace /> : <Navigate to="/customer-dashboard" replace />) : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/booking/:id" element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
        <Route index element={<Booking />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fuel" element={<FuelLogs />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="admin/bookings" element={<AdminBookings />} />
        <Route path="tracking" element={<TrackingPage />} />
        <Route path="playback/:tripId" element={<TripPlaybackPage />} />
        <Route path="reports/optimization" element={<OptimizationReports />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/" element={<ProtectedRoute customerOnly><CustomerLayout /></ProtectedRoute>}>
         <Route path="customer-dashboard" element={<CustomerDashboard />} />
         <Route path="customer-profile" element={<CustomerProfile />} />
         <Route path="booking-details/:id" element={<BookingDetails />} />
      </Route>

      {/* Full-screen tracking page (no layout wrapper for immersive experience) */}
      <Route path="/track/:id" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
