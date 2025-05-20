import React, { useEffect, useState } from 'react';
import './work_upload.css';
import AdminSidebar from '../../components/Admin/adminsidebar';
import AdminNavbar from '../../components/Admin/adminnavbar';
import "../../components/styles/table.css";
import "../../components/styles/buttons.css";
import "../../components/styles/search-container.css";
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import Swal from 'sweetalert2';

const WorkUpload = () => {
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to normalize status values
  const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const statusLower = status.toLowerCase();
    if (statusLower === "pending") return "Pending";
    if (statusLower === "approved") return "Approved";
    if (statusLower === "rejected" || statusLower === "reject") return "Rejected";
    return "Pending"; // Fallback for unexpected values
  };

  // Fetch work uploads for admin view
  const fetchUploads = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/upload/admin");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      // Normalize status values
      const normalizedData = data.map(upload => ({
        ...upload,
        status: normalizeStatus(upload.status),
      }));
      setUploads(normalizedData);
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      setError("Failed to fetch uploads!");
      setUploads([]);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleStatusChange = async (workId, newStatus) => {
    // Normalize the new status
    const normalizedStatus = normalizeStatus(newStatus);
    
    // Optimistically update local state
    setUploads((prev) =>
      prev.map((upload) =>
        upload.work_id === workId ? { ...upload, status: normalizedStatus } : upload
      )
    );

    try {
      let response;

      if (normalizedStatus === 'Approved') {
        response = await fetch(`http://localhost:5000/api/upload/approve/${workId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (normalizedStatus === 'Rejected') {
        response = await fetch(`http://localhost:5000/api/upload/reject/${workId}`, {
          method: 'POST',
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update status: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Show success message
      Swal.fire({
        title: 'Status Updated!',
        text: `Work status changed to ${normalizedStatus}.`,
        icon: 'success',
        customClass: {
          confirmButton: 'btn btn-success swal2-confirm',
        },
        buttonsStyling: false,
      });
    } catch (error) {
      console.error("Failed to update upload status:", error);
      // Revert local state on error
      setUploads((prev) => prev.map((upload) => 
        upload.work_id === workId ? { ...upload, status: upload.status } : upload
      ));
      setError(`Failed to update upload status: ${error.message}`);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update work status.',
        icon: 'error',
        customClass: {
          confirmButton: 'btn btn-danger swal2-confirm',
        },
        buttonsStyling: false,
      });
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const openAddModal = () => {
    // Define the logic for opening the add modal here
  };

  const handleFrontendDelete = (workId) => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
    swalWithBootstrapButtons.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        setUploads((prev) => prev.filter((upload) => upload.work_id !== workId));
        swalWithBootstrapButtons.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success"
        });
      } else if (
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire({
          title: "Cancelled",
          text: "Your imaginary file is safe :)",
          icon: "error"
        });
      }
    });
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
      <div className="main-user-content">
        <AdminNavbar />
        <div className="user-content">
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
                <th>Product Name</th>
                <th>Category</th>
                <th>Crafter</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredUploads) && filteredUploads.map((upload) => (
                <tr key={upload.work_id}>
                  <td>{upload.product_name}</td>
                  <td>{upload.CategoryName}</td>
                  <td>{upload.crafter}</td>
                  <td>{upload.quantity}</td>
                  <td>{upload.price}</td>
                  <td>{upload.status}</td>
                  <td>{upload.created_at ? new Date(upload.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <select
                      className="styled-status-dropdown"
                      value={upload.status || "Pending"} // Fallback to "Pending"
                      onChange={(e) => handleStatusChange(upload.work_id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    {upload.status !== 'Pending' && (
                      <button
                        className="delete-button"
                        style={{ marginLeft: 8 }}
                        title="Remove from view"
                        onClick={() => handleFrontendDelete(upload.work_id)}
                      >
                        <FiTrash2 style={{ fontSize: '1.1em' }} />
                      </button>
                    )}
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