const express = require('express');
const router = express.Router();
const connection = require('../database/db.js');
const authenticateToken = require('../authenticator/authentication.js');

router.post('/customer/register', async (req, res) => {
    try{
        const db = await connection(); 
        const { name, username } = req.body;

        const checkUserQuery = 'SELECT * FROM customers WHERE username = ?';
        const [existingUser ] = await db.execute(checkUserQuery, [username]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose another.' });
        }

        const insertUserQuery =
          "INSERT INTO customers (name, username, timestamp_add, timestamp_update) VALUES (?, ?, NOW(), NOW())";
        await db.execute(insertUserQuery, [name, username]);

        res.status(201).json({ message: 'Customer registered successfully' });
    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/customers", authenticateToken, async (req, res) => {
    try {
        const db = await connection();
        const [results] = await db.execute(
            "SELECT customer_id, name, username, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') AS timestamp_update FROM customers ORDER BY timestamp_update DESC"
        );
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading customers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/customer/:id", authenticateToken, async (req, res) => {
    let customer_id = req.params.id;

    if (!customer_id) {
        return req
        .status(400)
        .send({ error: true, message: "Please provide customer_id" });
    }

    try {
        const db = await connection();
        const [results] = await db.execute(
            "SELECT customer_id, name, username, DATE_FORMAT(timestamp_add, '%Y-%m-%d %h:%i %p') AS timestamp_add, DATE_FORMAT(timestamp_update, '%Y-%m-%d %h:%i %p') AS timestamp_update FROM customers WHERE customer_id = ?",
            [customer_id]
        );
        res.status(200).json(results);
    } catch (error) {
        console.error("Error loading customer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put('/customer/:id', authenticateToken, async (req, res) => {
    let customer_id = req.params.id;
    const {name, username} = req.body;

    if (!customer_id || !name || !username) {
        return res.status(400).send({ error: true, message: 'Please provide name and username' });  
    }

    try {
        const db = await connection();
        const checkUserQuery = 'SELECT * FROM customers WHERE username = ? AND customer_id != ?';
        const [existingUser ] = await db.execute(checkUserQuery, [username, customer_id]);

        if (existingUser .length > 0) {
            return res.status(409).json({ message: 'Username already exists. Please choose another.' });
        }

        const updateUserQuery =
          "UPDATE customers SET name = ?, username = ?, timestamp_update = NOW() WHERE customer_id = ?";
        await db.execute(updateUserQuery, [name, username, customer_id]);

        res.status(200).json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete("/customer/:id", authenticateToken, async (req, res) => {
    let customer_id = req.params.id;

    if (!customer_id) {
        return res
        .status(400)
        .send({ error: true, message: "Please provide customer_id" });
    }

    try {
        const db = await connection();
        await db.execute("DELETE FROM customers WHERE customer_id = ?", [customer_id]);
        res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;