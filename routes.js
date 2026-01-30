const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('./db');

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});

const upload = multer({ storage: storage });

// Create a new driver
router.post('/drivers', upload.single('photo'), (req, res) => {
    const { name, mobile, joining_date, present_address, permanent_address, current_car_no, past_car_no } = req.body;
    const file = req.file;
    const photo_url = file ? `/uploads/${file.filename}` : null;

    const sql = `INSERT INTO drivers (name, mobile, joining_date, present_address, permanent_address, photo_url, current_car_no, past_car_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, mobile, joining_date, present_address, permanent_address, photo_url, current_car_no, past_car_no];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Driver added successfully',
            data: {
                id: this.lastID,
                ...req.body,
                photo_url
            }
        });
    });
});

// Update an existing driver
router.put('/drivers/:id', upload.single('photo'), (req, res) => {
    const { name, mobile, joining_date, present_address, permanent_address, current_car_no, past_car_no } = req.body;
    const file = req.file;
    const photo_url = file ? `/uploads/${file.filename}` : undefined; // undefined means don't update photo if not provided

    let sql = `UPDATE drivers SET name = ?, mobile = ?, joining_date = ?, present_address = ?, permanent_address = ?, current_car_no = ?, past_car_no = ?`;
    let params = [name, mobile, joining_date, present_address, permanent_address, current_car_no, past_car_no];

    if (photo_url) {
        sql += `, photo_url = ?`;
        params.push(photo_url);
    }

    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'Driver updated successfully',
            data: { id: req.params.id, ...req.body, photo_url: photo_url || 'unchanged' }
        });
    });
});

// Delete a driver
router.delete('/drivers/:id', (req, res) => {
    const sql = `DELETE FROM drivers WHERE id = ?`;
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Driver deleted successfully', data: this.changes });
    });
});

// Get single driver
router.get('/drivers/:id', (req, res) => {
    const sql = `SELECT * FROM drivers WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: row });
    });
});

// Get all drivers or search
router.get('/drivers', (req, res) => {
    const { search } = req.query;
    let sql = 'SELECT * FROM drivers';
    let params = [];

    if (search) {
        sql += ' WHERE name LIKE ? OR mobile LIKE ?';
        params = [`%${search}%`, `%${search}%`];
    }

    sql += ' ORDER BY id DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
});

module.exports = router;
