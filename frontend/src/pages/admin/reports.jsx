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

// Helper function to get filename suffix
const getFilenameSuffix = (startDate, endDate) => {
    if (startDate && endDate) {
        return `${startDate}_to_${endDate}`;
    }
    const today = new Date().toISOString().split('T')[0];
    return `all_time_${today}`;
};

const Reports = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [inventoryData, setInventoryData] = useState([]);
    const [ordersData, setOrdersData] = useState({ orders: [], orderItems: [], customizations: [], summary: {} });
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        try {
            // Build query string only if both dates are provided
            const query = startDate && endDate 
                ? `?startDate=${startDate}&endDate=${endDate}`
                : '';
            const response = await fetch(
                `http://localhost:5000/api/reports/inventory-report${query}`
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

    const handleGenerateOrdersReport = async () => {
        setIsLoading(true);
        try {
            const query = startDate && endDate 
                ? `?startDate=${startDate}&endDate=${endDate}`
                : '';
            const response = await fetch(
                `http://localhost:5000/api/reports/orders-report${query}`
            );
            if (response.ok) {
                const data = await response.json();
                setOrdersData(data);
            } else {
                alert('Error generating orders report');
            }
        } catch (error) {
            console.error('Error fetching orders report:', error);
            alert('Error generating orders report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadInventoryCSV = () => {
        if (inventoryData.length === 0) {
            alert('No inventory data to download');
            return;
        }

        const headers = ['Product ID,Product Name,Category,Base Price,Stock Quantity,Last Updated'];
        const csvRows = inventoryData.map(item =>
            `${item.product_id},${item.product_name},${item.category_name},${item.base_price},${item.stock_qty || 0},${item.last_updated}`
        );

        const csvContent = [...headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        saveAs(blob, `inventory_report_${getFilenameSuffix(startDate, endDate)}.csv`);
    };

    const handleDownloadOrdersCSV = () => {
        if (ordersData.orders.length === 0) {
            alert('No orders data to download');
            return;
        }

        const headers = ['Order ID,Order Date,Total Amount,Status,Shipping Address'];
        const csvRows = ordersData.orders.map(item =>
            `${item.order_id},${new Date(item.order_date).toLocaleDateString()},${item.total_amount},${item.status},${item.shipping_address}`
        );

        const csvContent = [...headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        saveAs(blob, `orders_report_${getFilenameSuffix(startDate, endDate)}.csv`);
    };

    const handleDownloadInventoryPDF = async () => {
        if (inventoryData.length === 0) {
            alert('No inventory data to download');
            return;
        }

        const reportContainer = document.querySelector('.inventory-report-container');
        if (!reportContainer) return;

        try {
            const canvas = await html2canvas(reportContainer, { 
                scale: 3, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                windowWidth: reportContainer.scrollWidth,
                windowHeight: reportContainer.scrollHeight 
            });
            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;
            const contentWidth = pdfWidth - 2 * margin;
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = pdfHeight - 2 * margin - 30;
            const totalPages = Math.ceil(imgHeight / pageHeight);

            pdf.setDrawColor(33, 150, 243);
            pdf.setLineWidth(0.5);
            pdf.rect(5, 5, 200, 287);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(75, 192, 192);
            pdf.setFontSize(18);
            pdf.text('Crafttary Inventory Report', 105, 15, { align: 'center' });
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) {
                    pdf.addPage();
                    pdf.setDrawColor(33, 150, 243);
                    pdf.setLineWidth(0.5);
                    pdf.rect(5, 5, 200, 287);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(75, 192, 192);
                    pdf.setFontSize(18);
                    pdf.text('Crafttary Inventory Report (Continued)', 105, 15, { align: 'center' });
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(`Page ${page + 1} of ${totalPages}`, 105, 22, { align: 'center' });
                }

                const srcY = page * pageHeight * (canvas.height / imgHeight);
                const srcHeight = Math.min(pageHeight * (canvas.height / imgHeight), canvas.height - srcY);
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = srcHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

                const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
                pdf.addImage(pageImgData, 'PNG', margin, 30, imgWidth, (srcHeight * imgWidth) / canvas.width, undefined, 'FAST');

                pdf.setFontSize(10);
                pdf.text(`Page ${page + 1} of ${totalPages}`, 105, pdfHeight - 10, { align: 'center' });
            }

            pdf.save(`inventory_report_${getFilenameSuffix(startDate, endDate)}.pdf`);
        } catch (error) {
            console.error('Error generating inventory PDF:', error);
            alert('Error generating inventory PDF');
        }
    };

    const handleDownloadOrdersPDF = async () => {
        if (ordersData.orders.length === 0) {
            alert('No orders data to download');
            return;
        }

        const reportContainer = document.querySelector('.orders-report-container');
        if (!reportContainer) return;

        try {
            const canvas = await html2canvas(reportContainer, { 
                scale: 3, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                windowWidth: reportContainer.scrollWidth,
                windowHeight: reportContainer.scrollHeight 
            });
            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;
            const contentWidth = pdfWidth - 2 * margin;
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = pdfHeight - 2 * margin - 30;
            const totalPages = Math.ceil(imgHeight / pageHeight);

            pdf.setDrawColor(33, 150, 243);
            pdf.setLineWidth(0.5);
            pdf.rect(5, 5, 200, 287);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(75, 192, 192);
            pdf.setFontSize(18);
            pdf.text('Crafttary Orders Report', 105, 15, { align: 'center' });
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) {
                    pdf.addPage();
                    pdf.setDrawColor(33, 150, 243);
                    pdf.setLineWidth(0.5);
                    pdf.rect(5, 5, 200, 287);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(75, 192, 192);
                    pdf.setFontSize(18);
                    pdf.text('Crafttary Orders Report (Continued)', 105, 15, { align: 'center' });
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(`Page ${page + 1} of ${totalPages}`, 105, 22, { align: 'center' });
                }

                const srcY = page * pageHeight * (canvas.height / imgHeight);
                const srcHeight = Math.min(pageHeight * (canvas.height / imgHeight), canvas.height - srcY);
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = srcHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

                const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
                pdf.addImage(pageImgData, 'PNG', margin, 30, imgWidth, (srcHeight * imgWidth) / canvas.width, undefined, 'FAST');

                pdf.setFontSize(10);
                pdf.text(`Page ${page + 1} of ${totalPages}`, 105, pdfHeight - 10, { align: 'center' });
            }

            pdf.save(`orders_report_${getFilenameSuffix(startDate, endDate)}.pdf`);
        } catch (error) {
            console.error('Error generating orders PDF:', error);
            alert('Error generating orders PDF');
        }
    };

    // Calculate inventory summary metrics
    const totalStockValue = inventoryData.reduce((sum, item) => sum + (item.base_price * (item.stock_qty || 0)), 0);
    const totalStockQuantity = inventoryData.reduce((sum, item) => sum + (item.stock_qty || 0), 0);
    const avgPrice = inventoryData.length > 0 ? totalStockValue / inventoryData.length : 0;

    // Inventory bar chart data
    const inventoryBarChartData = {
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

    // Inventory pie chart data
    const inventoryPieChartData = () => {
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

    // Orders bar chart data for total sales by product
    const ordersBarChartData = {
        labels: ordersData.orderItems.map(item => item.product_name),
        datasets: [
            {
                label: 'Total Sales (Rs.)',
                data: ordersData.orderItems.map(item => item.total_sales || 0),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Orders pie chart data for customizations distribution
    const ordersPieChartData = () => {
        return {
            labels: ordersData.customizations.map(item => `${item.customization_type}: ${item.customization_value}`),
            datasets: [
                {
                    label: 'Customizations',
                    data: ordersData.customizations.map(item => item.customization_count || 0),
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
                labels: {
                    font: {
                        size: 12,
                    },
                },
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
                    <div className="report-header">
                        <h1>Reports Dashboard</h1>
                        <p>Generate and download inventory and orders reports (dates optional)</p>
                    </div>
                    <div className="report-controls card">
                        <div className="date-picker-container">
                            <label>Start Date (Optional):</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="date-picker"
                            />
                        </div>
                        <div className="date-picker-container">
                            <label>End Date (Optional):</label>
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
                        <button
                            className="generate-report-button"
                            onClick={handleGenerateOrdersReport}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Generating...' : 'Generate Orders Report'}
                        </button>
                        {inventoryData.length > 0 && (
                            <>
                                <button className="download-button" onClick={handleDownloadInventoryCSV}>
                                    <FiDownload /> Download Inventory CSV
                                </button>
                                <button className="download-button" onClick={handleDownloadInventoryPDF}>
                                    <FiDownload /> Download Inventory PDF
                                </button>
                            </>
                        )}
                        {ordersData.orders.length > 0 && (
                            <>
                                <button className="download-button" onClick={handleDownloadOrdersCSV}>
                                    <FiDownload /> Download Orders CSV
                                </button>
                                <button className="download-button" onClick={handleDownloadOrdersPDF}>
                                    <FiDownload /> Download Orders PDF
                                </button>
                            </>
                        )}
                    </div>

                       {/* Show message if no data is available */}
    {inventoryData.length === 0 || ordersData.orders.length === 0 && !isLoading && (
        <div className="card no-data">
            <p>No records available for the selected date range.</p>
        </div>
    )}
                    {inventoryData.length > 0 && (
                        <div className="inventory-report-container card">
                            <div className="report-header">
                                <h2>Inventory Report</h2>
                                <p>
                                    {startDate && endDate 
                                        ? `From ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`
                                        : 'All Time'}
                                </p>
                            </div>
                            <div className="summary-section card">
                                <h3>Inventory Summary</h3>
                                <table className="summary-table">
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
                            <div className="report-table-container card">
                                <h3>Inventory Details</h3>
                                <table className="data-table">
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
                                <div className="chart-wrapper card">
                                    <h3>Stock Quantities by Product</h3>
                                    <div className="chart">
                                        <Bar
                                            data={inventoryBarChartData}
                                            options={{
                                                ...chartOptions,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: 'Stock Quantity',
                                                            font: { size: 12 },
                                                        },
                                                    },
                                                    x: {
                                                        title: {
                                                            display: true,
                                                            text: 'Products',
                                                            font: { size: 12 },
                                                        },
                                                        ticks: {
                                                            font: { size: 10 },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="chart-wrapper card">
                                    <h3>Inventory Distribution by Category</h3>
                                    <div className="chart">
                                        <Pie
                                            data={inventoryPieChartData()}
                                            options={{
                                                ...chartOptions,
                                                plugins: {
                                                    ...chartOptions.plugins,
                                                    legend: {
                                                        ...chartOptions.plugins.legend,
                                                        labels: {
                                                            font: { size: 12 },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="report-footer">
                                Generated on: {new Date().toLocaleString()} | Crafttary Inventory Report
                            </p>
                        </div>
                    )}
                    {ordersData.orders.length > 0 && (
                        <div className="orders-report-container card">
                            <div className="report-header">
                                <h2>Orders Report</h2>
                                <p>
                                    {startDate && endDate 
                                        ? `From ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`
                                        : 'All Time'}
                                </p>
                            </div>
                            <div className="summary-section card">
                                <h3>Orders Summary</h3>
                                <table className="summary-table">
                                    <tbody>
                                        <tr>
                                            <td>Total Orders</td>
                                            <td>{ordersData.summary.totalOrders || 0}</td>
                                        </tr>
                                        <tr>
                                            <td>Confirmed Orders</td>
                                            <td>{ordersData.summary.confirmedOrders || 0}</td>
                                        </tr>
                                        <tr>
                                            <td>Ready to Deliver Orders</td>
                                            <td>{ordersData.summary.readyToDeliverOrders || 0}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Earnings</td>
                                            <td>Rs.{(ordersData.summary.totalEarnings || 0).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="report-table-container card">
                                <h3>Order Details</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Order Date</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Shipping Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ordersData.orders.map((item) => (
                                            <tr key={item.order_id}>
                                                <td>{item.order_id}</td>
                                                <td>{new Date(item.order_date).toLocaleDateString()}</td>
                                                <td>Rs.{item.total_amount.toFixed(2)}</td>
                                                <td>{item.status}</td>
                                                <td>{item.shipping_address}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="report-table-container card">
                                <h3>Fast Moving Items</h3>
                                {ordersData.summary.noFastMovingMessage ? (
                                    <p>{ordersData.summary.noFastMovingMessage}</p>
                                ) : ordersData.summary.fastMovingItems?.length > 0 ? (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product ID</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Total Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ordersData.summary.fastMovingItems.map((item) => (
                                                <tr key={item.product_id}>
                                                    <td>{item.product_id}</td>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.category_name}</td>
                                                    <td>{item.total_quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No fast-moving items available.</p>
                                )}
                            </div>
                            <div className="report-table-container card">
                                <h3>Slow Moving Items</h3>
                                {ordersData.summary.slowMovingItems?.length > 0 ? (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product ID</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Total Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ordersData.summary.slowMovingItems.map((item) => (
                                                <tr key={item.product_id}>
                                                    <td>{item.product_id}</td>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.category_name}</td>
                                                    <td>{item.total_quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No slow-moving items available.</p>
                                )}
                            </div>
                            <div className="charts-container">
                                <div className="chart-wrapper card">
                                    <h3>Total Sales by Product</h3>
                                    <div className="chart">
                                        <Bar
                                            data={ordersBarChartData}
                                            options={{
                                                ...chartOptions,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: 'Total Sales (Rs.)',
                                                            font: { size: 12 },
                                                        },
                                                    },
                                                    x: {
                                                        title: {
                                                            display: true,
                                                            text: 'Products',
                                                            font: { size: 12 },
                                                        },
                                                        ticks: {
                                                            font: { size: 10 },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="chart-wrapper card">
                                    <h3>Customizations Distribution</h3>
                                    <div className="chart">
                                        <Pie
                                            data={ordersPieChartData()}
                                            options={{
                                                ...chartOptions,
                                                plugins: {
                                                    ...chartOptions.plugins,
                                                    legend: {
                                                        ...chartOptions.plugins.legend,
                                                        labels: {
                                                            font: { size: 12 },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="report-footer">
                                Generated on: {new Date().toLocaleString()} | Crafttary Orders Report
                            </p>
                        </div>
                    )}
                    {inventoryData.length === 0 && ordersData.orders.length === 0 && (
                        <div className="card no-data">
                            <p>No data available. Please generate a report.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;