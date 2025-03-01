import { NavLink, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiPackage, FiClipboard, FiFileText, FiUserCheck, FiTruck, FiBox, FiChevronDown } from "react-icons/fi"; // Icons
import "./adminsidebar.css"; // Import styles
import logo from "../../assets/logo.png"; // Adjust path based on your folder structure
import { useState, useEffect } from "react";

const Sidebar = () => {
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isInventoryActive, setIsInventoryActive] = useState(false);
    const location = useLocation();

    const toggleInventoryDropdown = () => {
        setIsInventoryOpen(!isInventoryOpen);
    };

    useEffect(() => {
        if (location.pathname.includes("/admin/inventory") || location.pathname.includes("/admin/products")) {
            setIsInventoryActive(true);
        } else {
            setIsInventoryActive(false);
        }
    }, [location]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Logo" className="sidebar-logo" />
                <h1>Crafttary</h1>
            </div>
            <nav>
                <ul>
                    <li>
                        <NavLink to="/admin-dashboard" activeClassName="active">
                            <FiHome /> Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/roles" activeClassName="active">
                            <FiUsers /> Users
                        </NavLink>
                    </li>
                    <li className={`dropdown-container ${isInventoryActive ? 'active' : ''}`}>
                        <div className="dropdown" onClick={toggleInventoryDropdown}>
                            <span className={`dropdown-link ${isInventoryOpen ? 'active' : ''}`}>
                                <FiBox /> Inventory <FiChevronDown />
                            </span>
                        </div>
                        {isInventoryOpen && (
                            <ul className="dropdown-menu">
                                <li>
                                    <NavLink to="/admin/inventory" activeClassName="active" onClick={() => setIsInventoryOpen(false)}>
                                        Categories
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/products" activeClassName="active" onClick={() => setIsInventoryOpen(false)}>
                                        Products
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li>
                        <NavLink to="/admin/work_upload" activeClassName="active">
                            <FiPackage /> Work uploads
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/orders" activeClassName="active">
                            <FiClipboard /> Orders
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/customers" activeClassName="active">
                            <FiUsers /> Customer Details
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/reports" activeClassName="active">
                            <FiFileText /> Reports
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/crafter-assignments" activeClassName="active">
                            <FiUserCheck /> Crafter Assignments
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/delivery-assignments" activeClassName="active">
                            <FiTruck /> Delivery Assignments
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;