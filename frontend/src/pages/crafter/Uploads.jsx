import React, { useEffect, useState } from "react";
import CrafterSidebar from "../../components/Admin/craftersidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import "./Uploads.css";
import "../../components/styles/table.css";

const Uploads = () => {
    const [uploads, setUploads] = useState([]);

    useEffect(() => {
        fetchUploads();
    }, []);

    const fetchUploads = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/upload");
            if (!response.ok) {
                const text = await response.text();
                console.error("Failed to fetch uploads:", text);
                return;
            }
            const data = await response.json();
            setUploads(data);
        } catch (error) {
            console.error("Failed to fetch uploads:", error);
        }
    };

    return (
        <div className="uploads-page">
            <CrafterSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <h1>Work Uploads</h1>
                    <table className="table uploads-table">
                        <thead>
                            <tr>
                                <th>WorkID</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uploads.length > 0 ? (
                                uploads.map((upload) => (
                                    <tr key={upload.work_id}>
                                        <td>{upload.work_id}</td>
                                        <td>{upload.product_name}</td>
                                        <td>{upload.CategoryName}</td>
                                        <td>{upload.quantity}</td>
                                        <td>{upload.status}</td>
                                        <td>
                                            <FiEdit className="icon" />
                                            <FiTrash2 className="icon" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No uploads found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Uploads;