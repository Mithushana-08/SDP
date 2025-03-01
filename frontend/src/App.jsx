import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPop from "./components/Login/LoginPopup";
import AdminDashboard from "./pages/admin/adashboard";
import Roles from "./pages/admin/roles";
import Products from "./pages/admin/products";
import Orders from "./pages/admin/orders";
import Customers from "./pages/admin/customers";
import Reports from "./pages/admin/reports";
import CrafterDashboard from "./pages/cdashboard";
import Inventory from "./pages/admin/inventory";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPop />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/roles" element={<Roles />} />
       <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/crafter-dashboard" element={<CrafterDashboard />} />
        <Route path="/admin/inventory" element={<Inventory
        />} />
      </Routes>
    </Router>
  );
};

export default App;