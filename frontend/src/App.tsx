import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Challans from './pages/Challans';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Mini ERP Dashboard</h1>
        <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Logout</button>
      </div>
      <p className="text-lg mb-8">Welcome back, <strong>{user?.name}</strong> ({user?.role})</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/customers" className="block p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Customers</h2>
          <p className="text-gray-600">Manage clients and leads</p>
        </Link>
        <Link to="/products" className="block p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Products & Stock</h2>
          <p className="text-gray-600">Catalog and adjustments</p>
        </Link>
        <Link to="/challans" className="block p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Challans</h2>
          <p className="text-gray-600">Sales workflows</p>
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
          <Route path="/challans" element={<ProtectedRoute><Layout><Challans /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
