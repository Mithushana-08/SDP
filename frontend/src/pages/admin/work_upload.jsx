import React, { useEffect, useState } from 'react';
import './work_upload.css';
import AdminSidebar from '../../components/Admin/adminsidebar';
import AdminNavbar from '../../components/Admin/adminnavbar';
import "../../components/styles/table.css";
import "../../components/styles/buttons.css"; // Import button styles
import "../../components/styles/search-container.css";
import { FiSearch } from 'react-icons/fi';

const WorkUpload = () => {
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handlePriceChange = async (workId, newPrice) => {
    try {
      const response = await fetch(`http://localhost:5000/api/upload/update-price/${workId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: newPrice }),
      });
      if (!response.ok) {
        throw new Error('Failed to update price');
      }
      fetchUploads(); // Refresh the uploads list
    } catch (error) {
      console.error("Failed to update price:", error);
      setError("Failed to update price!");
    }
  };

  const handleStatusChange = async (workId, newStatus) => {
    try {
      let response;
      if (newStatus === 'Approved') {
        response = await fetch(`http://localhost:5000/api/upload/approve/${workId}`, {
          method: 'POST',
        });
      } else if (newStatus === 'Rejected') {
        response = await fetch(`http://localhost:5000/api/upload/reject/${workId}`, {
          method: 'POST',
        });
      }
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update status: ${response.status} ${response.statusText} - ${errorText}`);
      }
  
      fetchUploads(); // Refresh the uploads list
    } catch (error) {
      console.error("Failed to update upload status:", error);
      setError(`Failed to update upload status: ${error.message}`);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const openAddModal = () => {
    // Define the logic for opening the add modal here
  };

  const filteredUploads = uploads.filter((upload) => {
    return (
      upload.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.CategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.crafter.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="customers-page">
      <AdminSidebar />
      <div className="main-content">
        <AdminNavbar />
        <div className="content">
          <div className="top-bar">
            <div className="top-bar-content">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search here..."
                  className="search-bar"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
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
              {Array.isArray(filteredUploads) && filteredUploads.map((upload) => (
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