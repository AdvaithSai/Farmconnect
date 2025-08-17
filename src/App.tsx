import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from './lib/store';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import FarmerDashboard from './pages/farmer/Dashboard';
import AddCrop from './pages/farmer/AddCrop';
import ManageOffers from './pages/farmer/ManageOffers';
import FarmerChats from './pages/farmer/Chats';
import RetailerDashboard from './pages/retailer/Dashboard';
import CropDetails from './pages/retailer/CropDetails';
import MyOffers from './pages/retailer/MyOffers';
import Checkout from './pages/retailer/Checkout';
import RetailerChats from './pages/retailer/Chats';
import NotFound from './pages/NotFound';
import TransactionDetails from './pages/retailer/TransactionDetails';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/Profile';

// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: JSX.Element, 
  requiredRole?: 'farmer' | 'retailer' 
}) => {
  const user = useAppStore(state => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/\" replace />;
  }
  
  return children;
};

function App() {
  // TODO: Replace Supabase logic with Firebase Auth logic for session and user state.

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        
        {/* Auth routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>
        
        {/* Farmer routes */}
        <Route path="farmer" element={
          <ProtectedRoute requiredRole="farmer">
            <Outlet />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<FarmerDashboard />} />
          <Route path="add-crop" element={<AddCrop />} />
          <Route path="offers" element={<ManageOffers />} />
          <Route path="chats" element={<FarmerChats />} />
        </Route>
        
        {/* Retailer routes */}
        <Route path="retailer" element={
          <ProtectedRoute requiredRole="retailer">
            <Outlet />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<RetailerDashboard />} />
          <Route path="crop/:id" element={<CropDetails />} />
          <Route path="offers" element={<MyOffers />} />
          <Route path="checkout/:offerId" element={<Checkout />} />
          <Route path="chats" element={<RetailerChats />} />
          <Route path="transaction/:id" element={<TransactionDetails />} />
        </Route>
        
        {/* Profile route */}
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;