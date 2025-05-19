import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";

const CrafterNavbar = () => {
    const navigate = useNavigate();
    return (
        <div className="crafter-navbar">
            {/* ...other nav content... */}
            <button className="icon-btn" onClick={() => navigate('/crafter/notifications')}>
                <FiBell />
            </button>
        </div>
    );
};

export default CrafterNavbar;
