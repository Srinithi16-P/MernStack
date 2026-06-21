import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PrivateRoute, AdminRoute } from './components/ProtectedRoutes';

// Pages
import HomePage           from './pages/HomePage';
import ProductsPage       from './pages/ProductsPage';
import ProductDetailPage  from './pages/ProductDetailPage';
import CartPage           from './pages/CartPage';
import CheckoutPage       from './pages/CheckoutPage';
import OrdersPage         from './pages/OrdersPage';
import OrderDetailPage    from './pages/OrderDetailPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import DashboardPage      from './pages/DashboardPage';
import ProfilePage        from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage       from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: '12px',
                fontSize: '14px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                color: '#3a2a1a',
                border: '1px solid rgba(194,86,26,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              },
              success: { iconTheme: { primary: '#c2561a', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                element={<HomePage />} />
            <Route path="/products"        element={<ProductsPage />} />
            <Route path="/products/:slug"  element={<ProductDetailPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            {/* ── Protected (user) ── */}
            <Route path="/cart"       element={<PrivateRoute><CartPage /></PrivateRoute>} />
            <Route path="/checkout"   element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/orders"     element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
            <Route path="/dashboard"  element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/profile"    element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            {/* ── Admin ── */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/*"         element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}