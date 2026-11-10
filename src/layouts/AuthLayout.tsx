import { Outlet } from 'react-router-dom';

// Auth pages (Login, Register, ForgotPassword) manage their own full-screen layout.
// The dark backdrop is pulled up behind the floating header so no light strip shows above the page.
const AuthLayout = () => {
  return (
    <div className="-mt-[88px] pt-[88px] bg-[#020d06]">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
