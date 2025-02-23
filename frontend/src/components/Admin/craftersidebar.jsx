import { NavLink } from "react-router-dom";
import { FiClipboard } from "react-icons/fi"; // Icons
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
                        <NavLink to="/crafter/orders" activeClassName="active">
                            <FiClipboard /> Orders
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default CrafterSidebar;