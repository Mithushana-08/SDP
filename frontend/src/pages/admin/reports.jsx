import React, { useState } from 'react';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./reports.css";
import { FiDownload } from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Reports = () => {
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
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory_report_${startDate}_to_${endDate}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = async () => {
        if (inventoryData.length === 0) {
            alert('No data to download');
            return;
        }

        const reportContent = document.querySelector('.report-content'); // Select the report section

        try {
            // Capture the report section as an image using html2canvas
            const canvas = await html2canvas(reportContent, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');

            // Create a new PDF document
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190; // Width of the image in the PDF
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

            // Add the captured image to the PDF
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

            // Save the PDF
            pdf.save(`inventory_report_${startDate}_to_${endDate}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF');
        }
    };

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
                        'rgba(255, 159, 64, 0.6)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
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
                        const value = context.parsed || context.parsed.y;
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
                    <h1>Inventory Reports</h1>
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
                        <div className="report-content">
                            <div className="report-table-container">
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
                                                <td>{item.category_name}</td>
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
                                        <Bar data={barChartData} options={{
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
                                        }} />
                                    </div>
                                </div>
                                <div className="chart-wrapper">
                                    <h3>Inventory Distribution by Category</h3>
                                    <div className="chart">
                                        <Pie data={pieChartData()} options={chartOptions} />
                                    </div>
                                </div>
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

export default Reports;