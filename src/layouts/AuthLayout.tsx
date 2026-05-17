import { Outlet } from 'react-router-dom';

// Auth pages (Login, Register, ForgotPassword) manage their own full-screen layout.
const AuthLayout = () => {
  return <Outlet />;
};

export default AuthLayout;