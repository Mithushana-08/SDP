import React, { useState } from 'react';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./reports.css";
import { FiDownload } from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Helper function to format date like "Monday, May 12, 2025"
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const InventoryReport = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [inventoryData, setInventoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/reports/inventory-report?startDate=${startDate}&endDate=${endDate}`
            );
            if (response.ok) {
                const data = await response.json();
                setInventoryData(data);
            } else {
                alert('Error generating inventory report');
            }
        } catch (error) {
            console.error('Error fetching inventory report:', error);
            alert('Error fetching inventory report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (inventoryData.length === 0) {
            alert('No data to download');
            return;
        }

        const headers = ['Product ID,Product Name,Category,Base Price,Stock Quantity,Last Updated'];
        const csvRows = inventoryData.map(item =>
            `${item.product_id},${item.product_name},${item.category_name},${item.base_price},${item.stock_qty || 0},${item.last_updated}`
        );

        const csvContent = [...headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        saveAs(blob, `inventory_report_${startDate}_to_${endDate}.csv`);
    };

  const handleDownloadPDF = async () => {
    if (inventoryData.length === 0) {
        alert('No data to download');
        return;
    }

    const reportContainer = document.querySelector('.report-container');
    if (!reportContainer) return;

    try {
        const canvas = await html2canvas(reportContainer, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190; // Width of the image in the PDF
        const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

        // Set border color
        pdf.setDrawColor(33, 150, 243); // Blue border color (#2196F3)

        // Add a border to the PDF
        pdf.setLineWidth(0.5);
        pdf.rect(5, 5, 200, 287); // Draw a rectangle (border) around the page

        // Add a styled header
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(75, 192, 192); // Teal header color (rgba(75, 192, 192, 0.6))
        pdf.setFontSize(18);
        pdf.text('Crafttary Inventory Report', 105, 15, { align: 'center' }); // Centered title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Reset text color to black for subheader
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' }); // Subheader

        // Add the captured content below the header
        pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);

        // Save the PDF
        pdf.save(`inventory_report_${startDate}_to_${endDate}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF');
    }
};
    // Calculate summary metrics
    const totalStockValue = inventoryData.reduce((sum, item) => sum + (item.base_price * (item.stock_qty || 0)), 0);
    const totalStockQuantity = inventoryData.reduce((sum, item) => sum + (item.stock_qty || 0), 0);
    const avgPrice = inventoryData.length > 0 ? totalStockValue / inventoryData.length : 0;

    // Bar chart data for stock quantities by product
    const barChartData = {
        labels: inventoryData.map(item => item.product_name),
        datasets: [
            {
                label: 'Stock Quantity',
                data: inventoryData.map(item => item.stock_qty || 0),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Pie chart data for inventory distribution by category
    const pieChartData = () => {
        const categoryQuantities = inventoryData.reduce((acc, item) => {
            const category = item.category_name || 'Uncategorized';
            acc[category] = (acc[category] || 0) + (item.stock_qty || 0);
            return acc;
        }, {});

        return {
            labels: Object.keys(categoryQuantities),
            datasets: [
                {
                    label: 'Inventory by Category',
                    data: Object.values(categoryQuantities),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ${value}`;
                    },
                },
            },
        },
    };

    return (
        <div className="reports-page">
            <AdminSidebar />
            <div className="main-content">
                <AdminNavbar />
                <div className="content">
                    <div className="report-controls">
                        <div className="date-picker-container">
                            <label>Start Date:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="date-picker"
                            />
                        </div>
                        <div className="date-picker-container">
                            <label>End Date:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="date-picker"
                            />
                        </div>
                        <button
                            className="generate-report-button"
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Generating...' : 'Generate Inventory Report'}
                        </button>
                        {inventoryData.length > 0 && (
                            <>
                                <button
                                    className="download-button"
                                    onClick={handleDownloadCSV}
                                >
                                    <FiDownload /> Download CSV
                                </button>
                                <button
                                    className="download-button"
                                    onClick={handleDownloadPDF}
                                >
                                    <FiDownload /> Download PDF
                                </button>
                            </>
                        )}
                    </div>
                    {inventoryData.length > 0 ? (
                        <div className="report-container">
                          
                            <div className="report-content">
                                <div className="summary-section">
                                    <h3>Inventory Summary</h3>
                                    <table className="table1">
                                        <tbody>
                                            <tr>
                                                <td>Total Stock Value</td>
                                                <td>Rs.{totalStockValue.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Stock Quantity</td>
                                                <td>{totalStockQuantity}</td>
                                            </tr>
                                            <tr>
                                                <td>Average Price per Product</td>
                                                <td>Rs.{avgPrice.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="report-table-container">
                                    <h3>Inventory Details</h3>
                                    <table className="table1">
                                        <thead>
                                            <tr>
                                                <th>Product ID</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Base Price</th>
                                                <th>Stock Quantity</th>
                                                <th>Last Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryData.map((item) => (
                                                <tr key={item.product_id}>
                                                    <td>{item.product_id}</td>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.category_name || 'Uncategorized'}</td>
                                                    <td>Rs.{item.base_price.toFixed(2)}</td>
                                                    <td>{item.stock_qty || 0}</td>
                                                    <td>{new Date(item.last_updated).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="charts-container">
                                    <div className="chart-wrapper">
                                        <h3>Stock Quantities by Product</h3>
                                        <div className="chart">
                                            <Bar
                                                data={barChartData}
                                                options={{
                                                    ...chartOptions,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            title: {
                                                                display: true,
                                                                text: 'Stock Quantity',
                                                            },
                                                        },
                                                        x: {
                                                            title: {
                                                                display: true,
                                                                text: 'Products',
                                                            },
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <h3>Inventory Distribution by Category</h3>
                                        <div className="chart">
                                            <Pie data={pieChartData()} options={chartOptions} />
                                        </div>
                                    </div>
                                </div>
                                <p className="report-footer">
                                    Generated on: {new Date().toLocaleString()} | Crafttary Inventory Report
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p>No inventory data available. Please generate a report.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryReport;