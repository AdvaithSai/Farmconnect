import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from './lib/store';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages: the landing page ships in the main bundle, everything else loads when visited
import Home from './pages/Home';
import ThemeLoader from './components/ThemeLoader';
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const FarmerDashboard = lazy(() => import('./pages/farmer/Dashboard'));
const AddCrop = lazy(() => import('./pages/farmer/AddCrop'));
const ManageOffers = lazy(() => import('./pages/farmer/ManageOffers'));
const FarmerChats = lazy(() => import('./pages/farmer/Chats'));
const RetailerDashboard = lazy(() => import('./pages/retailer/Dashboard'));
const CropDetails = lazy(() => import('./pages/retailer/CropDetails'));
const MyOffers = lazy(() => import('./pages/retailer/MyOffers'));
const Checkout = lazy(() => import('./pages/retailer/Checkout'));
const RetailerChats = lazy(() => import('./pages/retailer/Chats'));
const TransactionDetails = lazy(() => import('./pages/retailer/TransactionDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoading = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <ThemeLoader />
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: JSX.Element, 
  requiredRole?: 'farmer' | 'retailer' 
}) => {
  const user = useAppStore(state => state.user);
  const authReady = useAppStore(state => state.authReady);
  
  // Wait for the saved session to be restored before deciding to redirect
  if (!authReady) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Suspense fallback={<PageLoading />}>
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
          <Route path="edit-crop/:id" element={<AddCrop />} />
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
    </Suspense>
  );
}

export default App;