const db = require('../config/db');

// Get Crafter Dashboard Report (Month-wise)
const getCrafterDashboardReport = (req, res) => {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user authenticated' });
    }

    const { startDate, endDate } = req.query;
    const crafterId = req.user.id;

    // Prepare queries and params
    const workUploadsQuery = `SELECT COUNT(*) AS totalWorkUploads FROM work_upload WHERE crafter_id = ? `;
    const orderAssignmentsQuery = `SELECT COUNT(*) AS totalOrderAssignments FROM order_items WHERE crafter_id = ?`;
    const pendingAssignmentsQuery = `SELECT COUNT(*) AS pendingAssignments FROM order_items WHERE crafter_id = ? AND status = 'Pending'`;

    // Month-wise performance queries
    let performanceQuery = `
      SELECT 
    DATE_FORMAT(created_at, '%Y-%m') AS month,
    COUNT(*) AS work_uploads
FROM work_upload
WHERE crafter_id = ?
    `;
    let assignmentsPerformanceQuery = `
        SELECT 
            DATE_FORMAT(o.order_date, '%Y-%m') AS month,
            COUNT(*) AS order_assignments
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.crafter_id = ?
    `;

    const params = [crafterId];
    const performanceParams = [crafterId];
    const assignmentsParams = [crafterId];

    // Add date filter if provided
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        if (end < start) {
            return res.status(400).json({ message: 'End date cannot be before start date' });
        }
        const endDateWithTime = new Date(end);
        endDateWithTime.setDate(endDateWithTime.getDate() + 1);

        performanceQuery += ` AND created_at BETWEEN ? AND ?`;
        assignmentsPerformanceQuery += ` AND o.order_date BETWEEN ? AND ?`;

        performanceParams.push(startDate, endDateWithTime.toISOString().split('T')[0]);
        assignmentsParams.push(startDate, endDateWithTime.toISOString().split('T')[0]);
    }

    performanceQuery += ` GROUP BY DATE_FORMAT(created_at, '%Y-%m')`;
    assignmentsPerformanceQuery += ` GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')`;

    // Run all queries in sequence using callbacks
    db.query(workUploadsQuery, params, (err, workUploadsRows) => {
        if (err) {
            console.error('Error in workUploadsQuery:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        db.query(orderAssignmentsQuery, params, (err, orderAssignmentsRows) => {
            if (err) {
                console.error('Error in orderAssignmentsQuery:', err);
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }
            db.query(pendingAssignmentsQuery, params, (err, pendingAssignmentsRows) => {
                if (err) {
                    console.error('Error in pendingAssignmentsQuery:', err);
                    return res.status(500).json({ message: 'Internal server error', error: err.message });
                }
                db.query(performanceQuery, performanceParams, (err, workUploadsPerformance) => {
                    if (err) {
                        console.error('Error in performanceQuery:', err);
                        return res.status(500).json({ message: 'Internal server error', error: err.message });
                    }
                    db.query(assignmentsPerformanceQuery, assignmentsParams, (err, orderAssignmentsPerformance) => {
                        if (err) {
                            console.error('Error in assignmentsPerformanceQuery:', err);
                            return res.status(500).json({ message: 'Internal server error', error: err.message });
                        }

                        // Process performance data for the graph (month-wise)
                        const performanceData = {};
                        if (Array.isArray(workUploadsPerformance)) {
                            workUploadsPerformance.forEach(row => {
                                if (row && row.month) {
                                    const month = row.month; // e.g., "2024-05"
                                    performanceData[month] = {
                                        ...performanceData[month],
                                        work_uploads: parseInt(row.work_uploads) || 0
                                    };
                                }
                            });
                        }
                        if (Array.isArray(orderAssignmentsPerformance)) {
                            orderAssignmentsPerformance.forEach(row => {
                                if (row && row.month) {
                                    const month = row.month;
                                    performanceData[month] = {
                                        ...performanceData[month],
                                        order_assignments: parseInt(row.order_assignments) || 0
                                    };
                                }
                            });
                        }

                        const labels = Object.keys(performanceData).sort();
                        const workUploadsData = labels.map(month => performanceData[month]?.work_uploads || 0);
                        const orderAssignmentsData = labels.map(month => performanceData[month]?.order_assignments || 0);

                        // Format response
                        const reportData = {
                            totalWorkUploads: workUploadsRows[0] ? parseInt(workUploadsRows[0].totalWorkUploads) || 0 : 0,
                            totalOrderAssignments: orderAssignmentsRows[0] ? parseInt(orderAssignmentsRows[0].totalOrderAssignments) || 0 : 0,
                            pendingAssignments: pendingAssignmentsRows[0] ? parseInt(pendingAssignmentsRows[0].pendingAssignments) || 0 : 0,
                            performanceData: {
                                labels,
                                datasets: [
                                    {
                                        label: 'Work Uploads',
                                        data: workUploadsData,
                                        borderColor: '#4a90e2',
                                        backgroundColor: 'rgba(74, 144, 226, 0.2)',
                                        fill: true,
                                        tension: 0.1
                                    },
                                    {
                                        label: 'Order Assignments',
                                        data: orderAssignmentsData,
                                        borderColor: '#e94e77',
                                        backgroundColor: 'rgba(233, 78, 119, 0.2)',
                                        fill: true,
                                        tension: 0.1
                                    }
                                ]
                            }
                        };

                        res.status(200).json(reportData);
                    });
                });
            });
        });
    });
};

module.exports = { getCrafterDashboardReport };