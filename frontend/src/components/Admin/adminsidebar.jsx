import { NavLink } from "react-router-dom";
import { FiHome, FiUsers, FiPackage, FiClipboard, FiFileText, FiUserCheck, FiTruck } from "react-icons/fi"; // Icons
import "./adminsidebar.css"; // Import styles
import logo from "../../assets/logo.png"; // Adjust path based on your folder structure

const Sidebar = () => {
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
                   
                    <li>
                        <NavLink to="/admin/products" activeClassName="active">
                            <FiPackage /> Manage Products
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
