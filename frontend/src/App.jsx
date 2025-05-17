import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPop from "./components/Login/LoginPopup";
import AdminDashboard from "./pages/admin/adashboard";
import Roles from "./pages/admin/roles";
import Products from "./pages/admin/products";
import Product from "./pages/admin/product";
import Orders from "./pages/admin/orders";
import Customers from "./pages/admin/customers";
import Reports from "./pages/admin/reports";
import Inventory from "./pages/admin/inventory";
import WorkUpload from "./pages/admin/work_upload";
import Items from "./pages/admin/order_items";
import CrafterAssign from "./pages/admin/crafter_assign";
import Profile from "./pages/admin/Profile"; // Import the Profile page
import CrafterDashboard from "./pages/crafter/cdashboard";
import Assignments from "./pages/crafter/Assignments";
import Uploads from "./pages/crafter/Uploads";
import CrafterSettings from "./pages/crafter/settings";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPop />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/product" element={<Product />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/work_upload" element={<WorkUpload />} />
        <Route path="/admin/profile" element={<Profile />} /> {/* Add Profile route */}
        <Route path="/admin/order_items/:orderId" element={<Items />} /> {/* Updated route */}
        <Route path="/admin/crafter_assign" element={<CrafterAssign />} />
        <Route path="/crafter/cdashboard" element={<CrafterDashboard />} />
        <Route path="/crafter/Assignments" element={<Assignments />} /> 
        <Route path="/crafter/Uploads" element={<Uploads />} />
        <Route path="/crafter/settings" element={<CrafterSettings />} /> {/* Crafter Profile route */}
      </Routes>
    </Router>
  );
};

export default App;