
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Blog from './pages/Blog';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import AdminDashboard from './pages/AdminDashboard';
import VendorPanel from './pages/VendorPanel';
import WarehousePanel from './pages/WarehousePanel';
import ProductionPanel from './pages/ProductionPanel';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1, marginTop: '70px' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalogo" element={<Catalog />} />
                  <Route path="/producto/:id" element={<Product />} />
                  <Route path="/guia" element={<Blog />} />
                  <Route path="/carrito" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Protected Routes — Comercial */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/vendedor"
                    element={
                      <ProtectedRoute allowedRoles={[Role.VENDOR, Role.ADMIN]}>
                        <VendorPanel />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Routes — Industrial / ERP-MRP */}
                  <Route
                    path="/almacen"
                    element={
                      <ProtectedRoute allowedRoles={[Role.INVENTARIO, Role.ADMIN]}>
                        <WarehousePanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/produccion"
                    element={
                      <ProtectedRoute allowedRoles={[Role.ARTESANO, Role.ADMIN]}>
                        <ProductionPanel />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
