const express = require('express');
const router = express.Router();
const db = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.get('/revenue', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT
                    SUM(od.orderQuantity * p.productPrice) AS TotalRevenue
                FROM 
                    products p
                JOIN
                    order_details od ON p.product_id = od.product_id;
            `);
            const TotalRevenue = results[0].TotalRevenue || 0;
            res.status(200).json({ TotalRevenue });
        } catch (error) {
            console.error('Error loading total sales:', error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/sales', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT
                    SUM(orderQuantity) AS TotalSales
                FROM
                    order_details;
            `);
            const TotalSales = results[0].TotalSales || 0;
            res.status(200).json({ TotalSales });
        } catch (error) {
            console.error('Error loading total sales:', error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/sales-by-products', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT p.product_id, p.productName, SUM(o.orderQuantity * p.productPrice) AS total_sales
                FROM orders o
                JOIN products p ON o.product_id = p.product_id
                WHERE o.orderStatus != 'PENDING'
                GROUP BY p.product_id, p.productName
                ORDER BY total_sales DESC;
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error fetching sales by products:', error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/sales-by-month', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT 
                    DATE_FORMAT(STR_TO_DATE(timestamp_update, '%m-%d-%Y %h:%i %p'), '%Y-%M') AS month,
                    SUM(priceInTotal) AS sales_amount,
                    SUM(orderQuantity) AS total_sales
                FROM orders
                WHERE orderStatus != 'PENDING'
                GROUP BY month
                ORDER BY STR_TO_DATE(CONCAT('01-', SUBSTRING(month, 6)), '%d-%M-%Y');
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error fetching sales by month:', error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/orders-by-month', authenticateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
    
        try {
            const [results] = await connection.execute(`
                SELECT p.productName, 
                DATE_FORMAT(STR_TO_DATE(timestamp_update, '%m-%d-%Y %h:%i %p'), '%M') AS orderMonth, 
                COUNT(o.order_id) AS orderCount
                FROM products p
                LEFT JOIN orders o ON p.product_id = o.product_id
                GROUP BY p.productName, orderMonth
                ORDER BY orderCount DESC;
            `);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error fetching orders by month:', error);
            res.status(500).json({ error: "Internal Server Error" });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
