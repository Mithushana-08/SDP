import { NavLink } from "react-router-dom";
import { FiHome, FiClipboard, FiPackage, FiSettings } from "react-icons/fi"; // Icons
import "./adminsidebar.css"; // Import styles
import logo from "../../assets/logo.png"; // Adjust path based on your folder structure

const CrafterSidebar = () => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="Logo" className="sidebar-logo" />
                <h1>Crafttary</h1>
            </div>
            <nav>
                <ul>
                    <li>
                        <NavLink to="/crafter/cdashboard" activeClassName="active">
                            <FiHome /> Dashboard
                        </NavLink>
                    </li>
                    
                    <li>
                        <NavLink to="/crafter/Assignments" activeClassName="active">
                            <FiClipboard /> Order Assignments
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/crafter/Uploads" activeClassName="active">
                            <FiPackage /> Work Uploads
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/profile" activeClassName="active">
                            <FiSettings /> Settings
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default CrafterSidebar;