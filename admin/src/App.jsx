import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import LoginPage     from './pages/LoginPage';
import OverviewPage  from './pages/OverviewPage';
import OrdersPage    from './pages/OrdersPage';
import ProductsPage  from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import ReviewsPage   from './pages/ReviewsPage';

function AdminGuard({ children }) {
  const { auth, authLoading } = useAdminAuth();
  if (authLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'radial-gradient(circle at top, #f9efe7, #f2d4bf)' }}>
      <div style={{ textAlign:'center', color:'#6d5c51' }}>
        <div style={{ fontSize:'2rem', marginBottom:12 }}>🌿</div>
        <div style={{ fontSize:14 }}>Loading…</div>
      </div>
    </div>
  );
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}

function PublicGuard({ children }) {
  const { auth, authLoading } = useAdminAuth();
  if (authLoading) return null;
  if (auth) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<PublicGuard><LoginPage /></PublicGuard>} />
          <Route path="/admin" element={<AdminGuard><OverviewPage /></AdminGuard>} />
          <Route path="/admin/orders"     element={<AdminGuard><OrdersPage /></AdminGuard>} />
          <Route path="/admin/products"   element={<AdminGuard><ProductsPage /></AdminGuard>} />
          <Route path="/admin/categories" element={<AdminGuard><CategoriesPage /></AdminGuard>} />
          <Route path="/admin/reviews"    element={<AdminGuard><ReviewsPage /></AdminGuard>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}