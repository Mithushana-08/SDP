import React from 'react';
import './work_upload.css';
import AdminSidebar from '../../components/Admin/adminsidebar';
import AdminNavbar from '../../components/Admin/adminnavbar';

const WorkUpload = () => {
  return (
    <div className="customers-page">
      <AdminSidebar />
      <div className="main-content">
        <AdminNavbar />
        <div className="content">
          <h1>Work Upload</h1>
          <table className="work-upload-table">
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
              <tr>
                <td>1</td>
                <td>Handmade Vase</td>
                <td>Decor</td>
                <td>John Doe</td>
                <td>10</td>
                <td><input type="text" defaultValue="$25.00" /></td>
                <td>Pending</td>
                <td>
                  <select>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkUpload;