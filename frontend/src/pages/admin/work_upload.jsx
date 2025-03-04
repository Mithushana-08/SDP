import React, { useEffect, useState } from 'react';
import './work_upload.css';
import AdminSidebar from '../../components/Admin/adminsidebar';
import AdminNavbar from '../../components/Admin/adminnavbar';
import "../../components/styles/table.css";

const WorkUpload = () => {
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState(null);

  // Fetch work uploads for admin view
  const fetchUploads = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/upload/admin");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setUploads(data);
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      setError("Failed to fetch uploads!");
      setUploads([]); // Ensure uploads is an array even if fetch fails
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handlePriceChange = (workId, newPrice) => {
    // Handle price change logic here
  };

  const handleStatusChange = (workId, newStatus) => {
    // Handle status change logic here
  };

  return (
    <div className="customers-page">
      <AdminSidebar />
      <div className="main-content">
        <AdminNavbar />
        <div className="content">
          <h1>Work Upload Management</h1>
          {error && <p className="error-message">{error}</p>}
          <table className="table work-upload-table">
            <thead>
              <tr>
                <th>WorkID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Crafter</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(uploads) && uploads.map((upload) => (
                <tr key={upload.work_id}>
                  <td>{upload.work_id}</td>
                  <td>{upload.product_name}</td>
                  <td>{upload.CategoryName}</td>
                  <td>{upload.crafter}</td>
                  <td>{upload.quantity}</td>
                  <td>
                    <input
                      type="text"
                      defaultValue={upload.price}
                      onBlur={(e) => handlePriceChange(upload.work_id, e.target.value)}
                    />
                  </td>
                  <td>{upload.status}</td>
                  <td>
                    <select
                      defaultValue={upload.status}
                      onChange={(e) => handleStatusChange(upload.work_id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approve</option>
                      <option value="Rejected">Reject</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkUpload;