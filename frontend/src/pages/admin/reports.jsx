import React, { useState, useEffect } from 'react';
import AdminSidebar from "../../components/Admin/adminsidebar";
import AdminNavbar from "../../components/Admin/adminnavbar";
import "./reports.css";
import { FiDownload } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Modal Component for PDF Preview
const PDFPreviewModal = ({ isOpen, pdfUrl, onCancel, onDownload, pdfBlob, pdfFileName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay1">
            <div className="modal-content1">
                <button className="modal-close-button" onClick={onCancel}>
                    <IoClose size={24} />
                </button>
                <h2>PDF Preview</h2>
                <div className="pdf-preview1">
                    <iframe src={pdfUrl} title="PDF Preview" width="100%" height="600px" style={{ border: 'none' }} />
                </div>
                <button
                    className="download-button"
                    style={{ alignSelf: 'center', marginTop: 16, minWidth: 180 }}
                    onClick={onDownload}
                    disabled={!pdfBlob}
                >
                    <FiDownload style={{ marginRight: 8 }} /> Download PDF
                </button>
            </div>
        </div>
    );
};

// Helper functions
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

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
    const [crafterPerformanceData, setCrafterPerformanceData] = useState({ crafters: [], summary: {} });
    const [isLoading, setIsLoading] = useState(false);
    const [crafters, setCrafters] = useState([]);
    const [selectedCrafter, setSelectedCrafter] = useState('all');
    const [activeReport, setActiveReport] = useState('inventory');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
    const [pdfBlob, setPdfBlob] = useState(null);
    const [pdfFileName, setPdfFileName] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [customizableFilter, setCustomizableFilter] = useState('');
    const [activeCategories, setActiveCategories] = useState([]);
    const [terminatedCategories, setTerminatedCategories] = useState([]);
    const [terminatedProducts, setTerminatedProducts] = useState([]);
    const [customizableBreakdown, setCustomizableBreakdown] = useState({ customizable: 0, nonCustomizable: 0 });

    // Add state for visible cards
    const [visibleInventoryCards, setVisibleInventoryCards] = useState({
        summary: true,
        details: true,
        terminatedProducts: true,
        terminatedCategories: true,
        chart1: true,
        chart2: true,
        chart3: true,
        chart4: true,
    });

    const [visibleOrdersCards, setVisibleOrdersCards] = useState({
        summary: true,
        details: true,
        chart1: true,
    });

    const [visibleCrafterCards, setVisibleCrafterCards] = useState({
        summary: true,
        details: true,
        chart1: true,
        chart2: true,
    });

    // Helper to reset all cards to visible
    const resetInventoryCards = () => {
        setVisibleInventoryCards({
            summary: true,
            details: true,
            terminatedProducts: true,
            terminatedCategories: true,
            chart1: true,
            chart2: true,
            chart3: true,
            chart4: true,
        });
    };

    const resetCards = (reportType) => {
        if (reportType === 'inventory') resetInventoryCards();
        else if (reportType === 'orders') setVisibleOrdersCards({ summary: true, details: true, chart1: true });
        else if (reportType === 'crafter') setVisibleCrafterCards({ summary: true, details: true, chart1: true, chart2: true });
    };

    // Generic card close handler for all reports
    const closeCard = (reportType, key) => {
        if (reportType === 'inventory') {
            setVisibleInventoryCards((prev) => ({ ...prev, [key]: false }));
        } else if (reportType === 'orders') {
            setVisibleOrdersCards((prev) => ({ ...prev, [key]: false }));
        } else if (reportType === 'crafter') {
            setVisibleCrafterCards((prev) => ({ ...prev, [key]: false }));
        }
    };

    useEffect(() => {
        const fetchCrafters = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/reports/crafters');
                if (response.ok) {
                    const data = await response.json();
                    setCrafters(data);
                } else {
                    console.error('Error fetching crafters');
                }
            } catch (error) {
                console.error('Error fetching crafters:', error);
            }
        };
        fetchCrafters();
    }, []);

    const fetchInventoryReport = async () => {
        setIsLoading(true);
        try {
            let query = [];
            if (startDate && endDate) query.push(`startDate=${startDate}&endDate=${endDate}`);
            if (categoryFilter) query.push(`category=${categoryFilter}`);
            if (customizableFilter) query.push(`customizable=${customizableFilter}`);
            const queryString = query.length ? `?${query.join('&')}` : '';
            const response = await fetch(`http://localhost:5000/api/reports/inventory-report${queryString}`);
            if (response.ok) {
                const data = await response.json();
                setInventoryData(data.inventory || []);
                setTerminatedProducts(data.terminatedProducts || []);
                setActiveCategories(data.activeCategories || []);
                setTerminatedCategories(data.terminatedCategories || []);
                setCustomizableBreakdown(data.customizableBreakdown || { customizable: 0, nonCustomizable: 0 });
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

    const handleGenerateReport = fetchInventoryReport;

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
                setOrdersData({
                    ...data,
                    fastMovingItems: (data.summary && data.summary.fastMovingItems) || [],
                    slowMovingItems: (data.summary && data.summary.slowMovingItems) || []
                });
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

    const handleGenerateCrafterPerformanceReport = async () => {
        setIsLoading(true);
        try {
            const query = startDate && endDate 
                ? `?startDate=${startDate}&endDate=${endDate}&crafterId=${selectedCrafter}`
                : `?crafterId=${selectedCrafter}`;
            const response = await fetch(
                `http://localhost:5000/api/reports/crafter-performance${query}`
            );
            if (response.ok) {
                const data = await response.json();
                setCrafterPerformanceData(data);
            } else {
                alert('Error generating crafter performance report');
            }
        } catch (error) {
            console.error('Error fetching crafter performance report:', error);
            alert('Error generating crafter performance report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadInventoryCSV = () => {
        if (inventoryData.length === 0) {
            alert('No inventory data to download');
            return;
        }
        const headers = ['Product ID,Product Name,Category,Base Price (Rs.),Stock Quantity,Last Updated'];
        const csvRows = inventoryData.map(item =>
            `${item.product_id},${item.product_name},${item.category_name || 'Uncategorized'},${item.base_price.toFixed(2)},${item.stock_qty || 0},${new Date(item.last_updated).toLocaleDateString()}`
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
        const headers = ['Order ID,Order Date,Total Amount (Rs.),Status,Shipping Address'];
        const csvRows = ordersData.orders.map(item =>
            `${item.order_id},${new Date(item.order_date).toLocaleDateString()},${item.total_amount.toFixed(2)},${item.status},${item.shipping_address}`
        );
        const csvContent = [...headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        saveAs(blob, `orders_report_${getFilenameSuffix(startDate, endDate)}.csv`);
    };

    const handleDownloadCrafterPerformanceCSV = () => {
        if (crafterPerformanceData.crafters.length === 0) {
            alert('No crafter performance data to download');
            return;
        }
        const headers = ['Crafter ID,Crafter Name,Product Name,Category,Total Uploads,Approved,Rejected,Approval Rate (%),Order Assignments'];
        const csvRows = crafterPerformanceData.crafters.map(item =>
            `${item.crafter_id},${item.crafter_name},${item.product_name || 'All'},${item.category_name || 'All'},${item.total_uploads},${item.approved_uploads},${item.rejected_Uploads},${item.approval_rate.toFixed(2)},${item.order_assignments}`
        );
        const csvContent = [...headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        saveAs(blob, `crafter_performance_report_${getFilenameSuffix(startDate, endDate)}.csv`);
    };

    const generatePDFAndPreview = async (reportContainerSelector, reportTitle, fileName) => {
        const reportContainer = document.querySelector(reportContainerSelector);
        if (!reportContainer) {
            alert('Report container not found');
            return;
        }
        try {
            // Wait for rendering to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));
            const canvas = await html2canvas(reportContainer, {
                scale: 2,
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
            let position = 0;
            let pageNumber = 1;
            const totalPages = Math.ceil(imgHeight / (pdfHeight - 2 * margin - 40));
            while (position < imgHeight) {
                // Header
                pdf.setDrawColor(33, 150, 243);
                pdf.setLineWidth(0.5);
                pdf.rect(5, 5, 200, 287);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(75, 192, 192);
                pdf.setFontSize(18);
                pdf.text('Crafttary', 105, 15, { align: 'center' });
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
                pdf.text('Elagady, Kopay North, Kopay, Jaffna', 105, 22, { align: 'center' });
                pdf.text(reportTitle, 105, 29, { align: 'center' });
                // Content
                const pageHeight = pdfHeight - 2 * margin - 40;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = Math.min((pageHeight * canvas.height) / imgHeight, canvas.height - (position * canvas.height) / imgHeight);
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(
                    canvas,
                    0,
                    (position * canvas.height) / imgHeight,
                    canvas.width,
                    tempCanvas.height,
                    0,
                    0,
                    canvas.width,
                    tempCanvas.height
                );
                const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
                pdf.addImage(pageImgData, 'PNG', margin, 30, imgWidth, (tempCanvas.height * imgWidth) / canvas.width, undefined, 'FAST');
                // Footer
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                pdf.text(
                    `Generated on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} | Crafttary`,
                    105,
                    pdfHeight - 15,
                    { align: 'center' }
                );
                pdf.text(`Page ${pageNumber} of ${totalPages}`, 105, pdfHeight - 10, { align: 'center' });
                position += pageHeight;
                if (position < imgHeight) {
                    pdf.addPage();
                    pageNumber++;
                }
            }
            setPdfBlob(pdf.output('blob'));
            setPdfPreviewUrl(URL.createObjectURL(pdf.output('blob')));
            setPdfFileName(fileName);
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF');
        }
    };

    // Customizable breakdown chart
    const customizablePieChartData = {
        labels: ['Customizable', 'Non-Customizable'],
        datasets: [
            {
                label: 'Customizable Breakdown',
                data: [customizableBreakdown.customizable, customizableBreakdown.nonCustomizable],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            },
        ],
    };

    // Orders Bar Chart Data with custom colors
    const ordersBarChartData = {
        labels: ordersData.orderItems.map(item => item.product_name),
        datasets: [
            {
                label: 'Total Sales (Rs.)',
                data: ordersData.orderItems.map(item => item.total_sales || 0),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(20, 184, 166, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(20, 184, 166, 1)'
                ],
                borderWidth: 1
            },
        ],
    };

    // Crafter Bar Chart Data with custom colors
    const crafterBarChartData = {
        labels: crafterPerformanceData.crafters.map(item => item.crafter_name || 'Unknown'),
        datasets: [
            {
                label: 'Total Uploads',
                data: crafterPerformanceData.crafters.map(item => item.total_uploads || 0),
                backgroundColor: [
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(20, 184, 166, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(20, 184, 166, 1)'
                ],
                borderWidth: 1
            }
        ],
    };

    // Crafter Pie Chart Data with custom colors
    const crafterPieChartData = () => {
        const approvalCounts = crafterPerformanceData.crafters.reduce(
            (acc, item) => {
                acc.approved += item.approved_uploads || 0;
                acc.rejected += item.rejected_uploads || 0;
                acc.pending += item.pending_uploads || 0;
                return acc;
            },
            { approved: 0, rejected: 0, pending: 0 }
        );
        return {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [
                {
                    label: 'Approval Status',
                    data: [approvalCounts.approved, approvalCounts.rejected, approvalCounts.pending],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(255, 206, 86, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
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
            title: {
                display: true,
            },
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                },
                title: {
                },
            },
            y: {
                ticks: {
                },
                title: {
                },
            },
        },
    };

    const handleReportTypeChange = (reportType) => {
        setActiveReport(reportType);
        if (reportType !== 'inventory') setInventoryData([]);
        if (reportType !== 'orders') setOrdersData({ orders: [], orderItems: [], customizations: [], summary: {} });
        if (reportType !== 'crafter') setCrafterPerformanceData({ crafters: [], summary: {} });
    };

    // Filtered inventory data based on selected filters
    const filteredInventoryData = inventoryData.filter(item => {
        let match = true;
        if (categoryFilter) {
            match = match && String(item.category_name) === String(activeCategories.find(cat => cat.CategoryID === categoryFilter)?.CategoryName);
        }
        if (customizableFilter) {
            match = match && String(item.customizable) === (customizableFilter === 'yes' ? 'yes' : 'no');
        }
        return match;
    });

    // Filtered terminated products based on selected filters
    const filteredTerminatedProducts = terminatedProducts.filter(item => {
        let match = true;
        if (categoryFilter) {
            match = match && String(item.category_name) === String(activeCategories.find(cat => cat.CategoryID === categoryFilter)?.CategoryName);
        }
        if (customizableFilter) {
            match = match && String(item.customizable) === (customizableFilter === 'yes' ? 'yes' : 'no');
        }
        return match;
    });

    // Inventory summary calculations
    const totalStockValue = filteredInventoryData.reduce((sum, item) => sum + (item.base_price * (item.stock_qty || 0)), 0);
    const totalStockQuantity = filteredInventoryData.reduce((sum, item) => sum + (item.stock_qty || 0), 0);
    const avgPrice = filteredInventoryData.length > 0 ? (totalStockValue / filteredInventoryData.length) : 0;

    // Inventory Bar Chart Data
    const inventoryBarChartData = {
        labels: filteredInventoryData.map(item => item.product_name),
        datasets: [
            {
                label: 'Stock Quantity',
                data: filteredInventoryData.map(item => item.stock_qty || 0),
            }
        ]
    };

    // Inventory Pie Chart Data
    const inventoryPieChartData = () => {
        // Group by category and sum stock quantity
        const categoryMap = {};
        filteredInventoryData.forEach(item => {
            const cat = item.category_name || 'Uncategorized';
            if (!categoryMap[cat]) {
                categoryMap[cat] = 0;
            }
            categoryMap[cat] += item.stock_qty || 0;
        });
        return {
            labels: Object.keys(categoryMap),
            datasets: [
                {
                    label: 'Stock Quantity',
                    data: Object.values(categoryMap),
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(20, 184, 166, 0.6)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(20, 184, 166, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        };
    };

    // Stock Status Distribution Pie Chart Data
    const stockStatusPieChartData = {
        labels: ['In Stock', 'Low Stock', 'Out of Stock'],
        datasets: [
            {
                label: 'Stock Status Distribution',
                data: [
                    filteredInventoryData.filter(item => item.status === 'In Stock' && item.product_status === 'active').length,
                    filteredInventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').length,
                    filteredInventoryData.filter(item => item.status === 'Out of Stock' && item.product_status === 'active').length,
                ],
            },
        ],
    };

    // Add a helper to apply 'page-break-before' to all chart-wrapper cards except the first
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                const charts = document.querySelectorAll('.chart-wrapper.card');
                charts.forEach((el, idx) => {
                    if (idx > 0) {
                        el.classList.add('page-break-before');
                    } else {
                        el.classList.remove('page-break-before');
                    }
                });
            }, 100);
        }
    }, [inventoryData, ordersData, crafterPerformanceData, activeReport]);

    // PDF download handlers
    const handleDownloadInventoryPDF = () => {
        generatePDFAndPreview('.inventory-report-container', 'Inventory Report', `inventory_report_${getFilenameSuffix(startDate, endDate)}.pdf`);
    };
    const handleDownloadOrdersPDF = () => {
        generatePDFAndPreview('.orders-report-container', 'Orders Report', `orders_report_${getFilenameSuffix(startDate, endDate)}.pdf`);
    };
    const handleDownloadCrafterPerformancePDF = () => {
        generatePDFAndPreview('.crafter-performance-container', 'Crafter Performance Report', `crafter_performance_report_${getFilenameSuffix(startDate, endDate)}.pdf`);
    };

    // Add this function before the return statement in Reports
    const handleGenerateReportWithReset = () => {
        resetInventoryCards();
        handleGenerateReport();
    };

    return (
        <>
            <div className="reports-page">
                <AdminSidebar />
                <div className="main-user-content">
                    <AdminNavbar />
                    <div className="user-content">
                        <div className="report-header">
                            <h1>Reports Dashboard</h1>
                            <p>Generate and download inventory, orders, and crafter performance reports (dates optional)</p>
                        </div>
                        <div className="report-tabs">
                            <button
                                className={`report-tab ${activeReport === 'inventory' ? 'active' : ''}`}
                                onClick={() => handleReportTypeChange('inventory')}
                            >
                                Inventory Report
                            </button>
                            <button
                                className={`report-tab ${activeReport === 'orders' ? 'active' : ''}`}
                                onClick={() => handleReportTypeChange('orders')}
                            >
                                Orders Report
                            </button>
                            <button
                                className={`report-tab ${activeReport === 'crafter' ? 'active' : ''}`}
                                onClick={() => handleReportTypeChange('crafter')}
                            >
                                Crafter Performance
                            </button>
                        </div>
                        <div className="report-controls card">
                            <div className="controls-row">
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
                                {activeReport === 'inventory' && (
                                    <>
                                        <div className="date-picker-container">
                                            <label>Category:</label>
                                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="date-picker">
                                                <option value="">All</option>
                                                {activeCategories.map(cat => (
                                                    <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="date-picker-container">
                                            <label>Customizable:</label>
                                            <select value={customizableFilter} onChange={e => setCustomizableFilter(e.target.value)} className="date-picker">
                                                <option value="">All</option>
                                                <option value="yes">Customizable</option>
                                                <option value="no">Non-Customizable</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {activeReport === 'crafter' && (
                                    <div className="date-picker-container">
                                        <label>Select Crafter:</label>
                                        <select
                                            value={selectedCrafter}
                                            onChange={(e) => setSelectedCrafter(e.target.value)}
                                            className="date-picker"
                                        >
                                            <option value="all">All Crafters</option>
                                            {crafters.map(crafter => (
                                                <option key={crafter.id} value={crafter.id}>
                                                    {crafter.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="button-group">
                                {activeReport === 'inventory' && (
                                    <>
                                        <button
                                            className="generate-report-button"
                                            onClick={handleGenerateReportWithReset}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Generating...' : 'Generate Inventory Report'}
                                        </button>
                                        {inventoryData.length > 0 && (
                                            <>
                                                {/* <button className="download-button" onClick={handleDownloadInventoryCSV}>
                                                    <FiDownload /> Download CSV
                                                </button> */}
                                                <button className="download-button" onClick={handleDownloadInventoryPDF}>
                                                    <FiDownload /> Download PDF
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                {activeReport === 'orders' && (
                                    <>
                                        <button
                                            className="generate-report-button"
                                            onClick={handleGenerateOrdersReport}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Generating...' : 'Generate Orders Report'}
                                        </button>
                                        {ordersData.orders.length > 0 && (
                                            <>
                                                {/* <button className="download-button" onClick={handleDownloadOrdersCSV}>
                                                    <FiDownload /> Download CSV
                                                </button> */}
                                                <button className="download-button" onClick={handleDownloadOrdersPDF}>
                                                    <FiDownload /> Download PDF
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                {activeReport === 'crafter' && (
                                    <>
                                        <button
                                            className="generate-report-button"
                                            onClick={handleGenerateCrafterPerformanceReport}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Generating...' : 'Generate Crafter Performance Report'}
                                        </button>
                                        {crafterPerformanceData.crafters.length > 0 && (
                                            <>
                                                {/* <button className="download-button" onClick={handleDownloadCrafterPerformanceCSV}>
                                                    <FiDownload /> Download CSV
                                                </button> */}
                                                <button className="download-button" onClick={handleDownloadCrafterPerformancePDF}>
                                                    <FiDownload /> Download PDF
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <PDFPreviewModal
                            isOpen={showPreviewModal}
                            pdfUrl={pdfPreviewUrl}
                            onCancel={() => setShowPreviewModal(false)}
                            onDownload={() => {
                                if (pdfBlob) {
                                    saveAs(pdfBlob, pdfFileName);
                                }
                            }}
                            pdfBlob={pdfBlob}
                            pdfFileName={pdfFileName}
                        />

                        {inventoryData.length === 0 && ordersData.orders.length === 0 && crafterPerformanceData.crafters.length === 0 && !isLoading && (
                            <div >
                                <p></p>
                            </div>
                        )}

                        {inventoryData.length > 0 && activeReport === 'inventory' && (
                            <div className="inventory-report-container ">
                                <div className="report-header">
                                    <h2>Inventory Report</h2>
                                    <p>
                                        {startDate && endDate 
                                            ? `From ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`
                                            : 'All Time'}
                                    </p>
                                </div>
                                {visibleInventoryCards.summary && (
                                    <div className="summary-section card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('inventory', 'summary')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
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
                                                    <td>Low Stock Product Count</td>
                                                    <td>{filteredInventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').length}</td>
                                                </tr>
                                                <tr>
                                                    <td>Terminated Product Count</td>
                                                    <td>{terminatedProducts.length}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {visibleInventoryCards.details && (
                                    <div className="report-table-container card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('inventory', 'details')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Inventory Details</h3>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Product ID</th>
                                                    <th>Product Name</th>
                                                    <th>Category</th>
                                                    <th>Base Price</th>
                                                    <th>Stock Quantity</th>
                                                    <th>Status</th>
                                                    <th>Product Status</th>
                                                    <th>Customizable</th>
                                                    <th>Last Updated</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredInventoryData.map((item) => (
                                                    <tr key={item.product_id}>
                                                        <td>{item.product_id}</td>
                                                        <td>{item.product_name}</td>
                                                        <td>{item.category_name || 'Uncategorized'}</td>
                                                        <td>Rs.{item.base_price.toFixed(2)}</td>
                                                        <td>{item.stock_qty || 0}</td>
                                                        <td>{item.status}</td>
                                                        <td>{item.product_status}</td>
                                                        <td>{item.customizable === 'yes' ? 'Customizable' : 'Non-Customizable'}</td>
                                                        <td>{new Date(item.last_updated).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {terminatedProducts.length > 0 && visibleInventoryCards.terminatedProducts && (
                                    <div className="report-table-container card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('inventory', 'terminatedProducts')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Terminated Products</h3>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Product ID</th>
                                                    <th>Product Name</th>
                                                    <th>Category</th>
                                                    <th>Base Price</th>
                                                    <th>Stock Quantity</th>
                                                    <th>Product Status</th>
                                                    <th>Customizable</th>
                                                    <th>Last Updated</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTerminatedProducts.map(item => (
                                                    <tr key={item.product_id}>
                                                        <td>{item.product_id}</td>
                                                        <td>{item.product_name}</td>
                                                        <td>{item.category_name || 'Uncategorized'}</td>
                                                        <td>Rs.{item.base_price.toFixed(2)}</td>
                                                        <td>{item.stock_qty || 0}</td>
                                                        <td>{item.product_status}</td>
                                                        <td>{item.customizable === 'yes' ? 'Customizable' : 'Non-Customizable'}</td>
                                                        <td>{new Date(item.last_updated).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {terminatedCategories.length > 0 && visibleInventoryCards.terminatedCategories && (
                                    <div className="report-table-container card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('inventory', 'terminatedCategories')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Terminated Categories</h3>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Category ID</th>
                                                    <th>Category Name</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {terminatedCategories.map(cat => (
                                                    <tr key={cat.CategoryID}>
                                                        <td>{cat.CategoryID}</td>
                                                        <td>{cat.CategoryName}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="charts-container">
                                    {visibleInventoryCards.chart1 && (
                                        <div className="chart-wrapper card" style={{ position: 'relative' }}>
                                            <button
                                                className="card-close-btn"
                                                style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                                onClick={() => closeCard('inventory', 'chart1')}
                                                title="Remove this card"
                                            >
                                                <IoClose size={22} />
                                            </button>
                                            <h3>Stock Quantities by Product</h3>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
                                                <div className="chart" style={{ flex: 1 }}>
                                                    <Bar
                                                        data={{
                                                            ...inventoryBarChartData,
                                                            datasets: [
                                                                {
                                                                    ...inventoryBarChartData.datasets[0],
                                                                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                                                    borderColor: 'rgba(54, 162, 235, 1)',
                                                                    borderWidth: 1
                                                                }
                                                            ]
                                                        }}
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
                                                {/* Stock Status Product List (restored) */}
                                                <div className="custom-legend" style={{ minWidth: 220, marginTop: 16 }}>
                                                    <h4 style={{ marginBottom: 8, fontSize: 14 }}>Stock Status Products</h4>
                                                    <div style={{ marginBottom: 10 }}>
                                                        <span style={{ fontWeight: 600, color: '#facc15' }}>Low Stock:</span>
                                                        <ul style={{ margin: 0, paddingLeft: 18, color: '#facc15', fontSize: 13 }}>
                                                            {filteredInventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').map(item => (
                                                                <li key={item.product_id}>{item.product_name}</li>
                                                            ))}
                                                            {filteredInventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').length === 0 && (
                                                                <li style={{ color: '#888', fontStyle: 'italic' }}>None</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>Out of Stock:</span>
                                                        <ul style={{ margin: 0, paddingLeft: 18, color: '#ef4444', fontSize: 13 }}>
                                                            {filteredInventoryData.filter(item => item.status === 'Out of Stock' && item.product_status === 'active').map(item => (
                                                                <li key={item.product_id}>{item.product_name}</li>
                                                            ))}
                                                            {filteredInventoryData.filter(item => item.status === 'Out of Stock' && item.product_status === 'active').length === 0 && (
                                                                <li style={{ color: '#888', fontStyle: 'italic' }}>None</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {visibleInventoryCards.chart2 && (
                                        <div className="chart-wrapper card" style={{ position: 'relative' }}>
                                            <button
                                                className="card-close-btn"
                                                style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                                onClick={() => closeCard('inventory', 'chart2')}
                                                title="Remove this card"
                                            >
                                                <IoClose size={22} />
                                            </button>
                                            <h3>Inventory Distribution by Category</h3>
                                            <div className="chart">
                                                <Pie
                                                    data={{
                                                        ...inventoryPieChartData(),
                                                        datasets: [
                                                            {
                                                                ...inventoryPieChartData().datasets[0],
                                                                backgroundColor: [
                                                                    'rgba(54, 162, 235, 0.6)',
                                                                    'rgba(255, 206, 86, 0.6)',
                                                                    'rgba(75, 192, 192, 0.6)',
                                                                    'rgba(255, 99, 132, 0.6)',
                                                                    'rgba(153, 102, 255, 0.6)',
                                                                    'rgba(255, 159, 64, 0.6)',
                                                                    'rgba(20, 184, 166, 0.6)'
                                                                ],
                                                                borderColor: [
                                                                    'rgba(54, 162, 235, 1)',
                                                                    'rgba(255, 206, 86, 1)',
                                                                    'rgba(75, 192, 192, 1)',
                                                                    'rgba(255, 99, 132, 1)',
                                                                    'rgba(153, 102, 255, 1)',
                                                                    'rgba(255, 159, 64, 1)',
                                                                    'rgba(20, 184, 166, 1)'
                                                                ],
                                                                borderWidth: 1
                                                            }
                                                        ]
                                                    }}
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
                                    )}
                                    {visibleInventoryCards.chart3 && (
                                        <div className="chart-wrapper card" style={{ position: 'relative' }}>
                                            <button
                                                className="card-close-btn"
                                                style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                                onClick={() => closeCard('inventory', 'chart3')}
                                                title="Remove this card"
                                            >
                                                <IoClose size={22} />
                                            </button>
                                            <h3>Customizable vs Non-Customizable Products</h3>
                                            <div className="chart">
                                                <Pie
                                                    data={{
                                                        ...customizablePieChartData,
                                                        datasets: [
                                                            {
                                                                ...customizablePieChartData.datasets[0],
                                                                backgroundColor: [
                                                                    'rgba(54, 162, 235, 0.7)',
                                                                    'rgba(255, 206, 86, 0.7)'
                                                                ],
                                                                borderColor: [
                                                                    'rgba(54, 162, 235, 1)',
                                                                    'rgba(255, 206, 86, 1)'
                                                                ],
                                                                borderWidth: 1
                                                            }
                                                        ]
                                                    }}
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
                                    )}
                                    {visibleInventoryCards.chart4 && (
                                        <div className="chart-wrapper card no-break-inside" style={{ position: 'relative', pageBreakInside: 'avoid', breakInside: 'avoid', overflow: 'visible' }}>
                                            <button
                                                className="card-close-btn"
                                                style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                                onClick={() => closeCard('inventory', 'chart4')}
                                                title="Remove this card"
                                            >
                                                <IoClose size={22} />
                                            </button>
                                            <h3>Stock Status Distribution</h3>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
                                                <div className="chart" style={{ flex: 1 }}>
                                                    <Pie
                                                        data={{
                                                            ...stockStatusPieChartData,
                                                            datasets: [
                                                                {
                                                                    ...stockStatusPieChartData.datasets[0],
                                                                    backgroundColor: [
                                                                        'rgba(20, 184, 166, 0.7)',
                                                                        'rgba(250, 204, 21, 0.7)',
                                                                        'rgba(239, 68, 68, 0.7)'
                                                                    ],
                                                                    borderColor: [
                                                                        'rgba(20, 184, 166, 1)',
                                                                        'rgba(250, 204, 21, 1)',
                                                                        'rgba(239, 68, 68, 1)'
                                                                    ],
                                                                    borderWidth: 1
                                                                }
                                                            ]
                                                        }}
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
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: function(context) {
                                                                            const label = context.label || '';
                                                                            const value = context.parsed || 0;
                                                                            let productNames = [];
                                                                            if (label === 'Low Stock') {
                                                                                productNames = inventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').map(item => item.product_name);
                                                                            } else if (label === 'Out of Stock') {
                                                                                productNames = inventoryData.filter(item => item.status === 'Out of Stock' && item.product_status === 'active').map(item => item.product_name);
                                                                            } else if (label === 'In Stock') {
                                                                                productNames = inventoryData.filter(item => item.status === 'In Stock' && item.product_status === 'active').map(item => item.product_name);
                                                                            }
                                                                            let tooltip = `${label}: ${value}`;
                                                                            if (productNames.length > 0) {
                                                                                tooltip += `\nProducts: ${productNames.join(', ')}`;
                                                                            }
                                                                            return tooltip;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="custom-legend" style={{ minWidth: 220, marginTop: 16 }}>
                                                    <h4 style={{ marginBottom: 8, fontSize: 14 }}>Stock Status Products</h4>
                                                    <div style={{ marginBottom: 10 }}>
                                                        <span style={{ fontWeight: 600, color: '#facc15' }}>Low Stock:</span>
                                                        <ul style={{ margin: 0, paddingLeft: 18, color: '#facc15', fontSize: 13 }}>
                                                            {inventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').length > 0 ? (
                                                                inventoryData.filter(item => item.status === 'Low Stock' && item.product_status === 'active').map(item => (
                                                                    <li key={item.product_id}>{item.product_name}</li>
                                                                ))
                                                            ) : (
                                                                <li style={{ color: '#888', fontStyle: 'italic' }}>None</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>Out of Stock:</span>
                                                        <ul style={{ margin: 0, paddingLeft: 18, color: '#ef4444', fontSize: 13 }}>
                                                            {inventoryData.filter(item => item.status === 'Out of Stock' && item.product_status === 'active').length > 0 ? (
                                                                inventoryData.filter(item => item.status === 'Out of Stock' && item.product_status === 'active').map(item => (
                                                                    <li key={item.product_id}>{item.product_name}</li>
                                                                ))
                                                            ) : (
                                                                <li style={{ color: '#888', fontStyle: 'italic' }}>None</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {ordersData.orders.length > 0 && activeReport === 'orders' && (
                            <div className="orders-report-container ">
                                <div className="report-header">
                                    <h2>Orders Report</h2>
                                    <p>
                                        {startDate && endDate 
                                            ? `From ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`
                                            : 'All Time'}
                                    </p>
                                </div>
                                {visibleOrdersCards.summary && (
                                    <div className="summary-section card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('orders', 'summary')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
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
                                )}
                                {visibleOrdersCards.details && (
                                    <div className="report-table-container card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('orders', 'details')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
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
                                )}
                                {visibleOrdersCards.chart1 && (
                                    <div className="chart-wrapper card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('orders', 'chart1')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
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
                                        {/* Fast/Slow Moving Items */}
                                        <div style={{ display: 'flex', gap: 32, marginTop: 24 }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ marginBottom: 8 }}>Top 5 Fast Moving Items</h4>
                                                <ol style={{ paddingLeft: 18 }}>
                                                    {(ordersData.fastMovingItems || []).slice(0, 5).map(item => (
                                                        <li key={item.product_id}>
                                                            {item.product_name} <span style={{ color: '#888', fontSize: 13 }}>(Sold: {item.total_quantity})</span>
                                                        </li>
                                                    ))}
                                                    {(ordersData.fastMovingItems || []).length === 0 && (
                                                        <li style={{ color: '#888', fontStyle: 'italic' }}>No data</li>
                                                    )}
                                                </ol>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ marginBottom: 8 }}>Last 5 Slow Moving Items</h4>
                                                <ol style={{ paddingLeft: 18 }}>
                                                    {(ordersData.slowMovingItems || []).slice(-5).map(item => (
                                                        <li key={item.product_id}>
                                                            {item.product_name} <span style={{ color: '#888', fontSize: 13 }}>(Sold: {item.total_quantity})</span>
                                                        </li>
                                                    ))}
                                                    {(ordersData.slowMovingItems || []).length === 0 && (
                                                        <li style={{ color: '#888', fontStyle: 'italic' }}>No data</li>
                                                    )}
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {crafterPerformanceData.crafters.length > 0 && activeReport === 'crafter' && (
                            <div className="crafter-performance-container ">
                                <div className="report-header">
                                    <h2>Crafter Performance Report</h2>
                                    <p>
                                        {startDate && endDate 
                                            ? `From ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`
                                            : 'All Time'}
                                        {selectedCrafter !== 'all' 
                                            ? ` | Crafter: ${crafters.find(c => c.id === selectedCrafter)?.username || selectedCrafter}`
                                            : ' | All Crafters'}
                                    </p>
                                </div>
                                {visibleCrafterCards.summary && (
                                    <div className="summary-section card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('crafter', 'summary')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Crafter Performance Summary</h3>
                                        <table className="summary-table">
                                            <tbody>
                                                <tr>
                                                    <td>Total Crafters</td>
                                                    <td>{crafterPerformanceData.summary.totalCrafters || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td>Total Uploads</td>
                                                    <td>{crafterPerformanceData.summary.totalUploads || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td>Approval Rate</td>
                                                    <td>{(crafterPerformanceData.summary.approvalRate || 0).toFixed(2)}%</td>
                                                </tr>
                                                <tr>
                                                    <td>Total Order Assignments</td>
                                                    <td>{crafterPerformanceData.summary.totalAssignments || 0}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {visibleCrafterCards.details && (
                                    <div className="report-table-container card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('crafter', 'details')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Crafter Performance Details</h3>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Crafter ID</th>
                                                    <th>Crafter Name</th>
                                                    <th>Product Name</th>
                                                    <th>Category</th>
                                                    <th>Total Uploads</th>
                                                    <th>Approved</th>
                                                    <th>Rejected</th>
                                                    <th>Approval Rate</th>
                                                    <th>Order Assignments</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {crafterPerformanceData.crafters.map((item) => (
                                                    <tr key={`${item.crafter_id}-${item.product_id || 'all'}`}>
                                                        <td>{item.crafter_id}</td>
                                                        <td>{item.crafter_name}</td>
                                                        <td>{item.product_name || 'All'}</td>
                                                        <td>{item.category_name || 'All'}</td>
                                                        <td>{item.total_uploads}</td>
                                                        <td>{item.approved_uploads}</td>
                                                        <td>{item.rejected_uploads}</td>
                                                        <td>{item.approval_rate.toFixed(2)}%</td>
                                                        <td>{item.order_assignments}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {visibleCrafterCards.chart1 && (
                                    <div className="chart-wrapper card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('crafter', 'chart1')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Uploads by Crafter</h3>
                                        <div className="chart">
                                            <Bar
                                                data={crafterBarChartData}
                                                options={{
                                                    ...chartOptions,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            title: {
                                                                display: true,
                                                                text: 'Total Uploads',
                                                                font: { size: 12 },
                                                            },
                                                        },
                                                        x: {
                                                            title: {
                                                                display: true,
                                                                text: 'Crafters',
                                                                font: { size: 12 },
                                                            },
                                                            ticks: {
                                                                font: { size: 10 },
                                                                maxRotation: 45,
                                                                minRotation: 45,
                                                            },
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {visibleCrafterCards.chart2 && (
                                    <div className="chart-wrapper card" style={{ position: 'relative' }}>
                                        <button
                                            className="card-close-btn"
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', zIndex: 2 }}
                                            onClick={() => closeCard('crafter', 'chart2')}
                                            title="Remove this card"
                                        >
                                            <IoClose size={22} />
                                        </button>
                                        <h3>Approval Status Distribution</h3>
                                        <div className="chart">
                                            <Pie
                                                data={crafterPieChartData()}
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
                                )}
                            </div>
                        )}

                        {inventoryData.length === 0 && ordersData.orders.length === 0 && crafterPerformanceData.crafters.length === 0 && (
                            <div className=" no-data">
                                <p>No data available. Please generate a report.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Stronger print rules to prevent chart-wrapper card splitting */}
            <style>{`
@media print {
  .card-close-btn {
    display: none !important;
  }
  .card, .chart-wrapper.card, .no-break-inside {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    display: table !important;
    overflow: visible !important;
    box-shadow: none !important;
    background: white !important;
  }
  .charts-container {
    display: block !important;
  }
  .page-break-before {
    page-break-before: always !important;
    break-before: always !important;
  }
}
`}</style>
        </>
    );
};

export default Reports;