/**
 * DBU Clearance System - Main Server File
 * @description University clearance management system built with Node.js & Express
 * @version 1.0.0
 */

// ==================== DEPENDENCIES & CONFIGURATION ====================
require('dotenv').config(); // Load environment variables first

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');


const app = express();

// ==================== MIDDLEWARE SETUP ====================
app.set('trust proxy', 1); // Trust first proxy (Render)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'dbu-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ==================== DATABASE CONFIGURATION ====================
// ==================== DATABASE CONFIGURATION ====================
const pool = require('./config/db');

// Database middleware
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ==================== ROUTE IMPORTS ====================
const routes = {
    auth: require('./routes/auth'),
    student: require('./routes/student'),
    admin: require('./routes/admin'),
    cafeteria: require('./routes/cafeteria'),
    dormitory: require('./routes/dormitory'),
    department: require('./routes/department'),
    registrar: require('./routes/registrar'),
    protector: require('./routes/protector'),
    library: require('./routes/library')
};

// ==================== ROUTE REGISTRATION ====================
// Authentication & Dashboard Routes
// We mount these BEFORE static/SPA handlers so they can handle specialized paths
app.use('/', routes.auth);
app.use('/student', routes.student);
app.use('/admin', routes.admin);
app.use('/admin', routes.cafeteria);
app.use('/admin', routes.dormitory);
app.use('/admin', routes.department);
app.use('/admin', routes.registrar);
app.use('/admin', routes.protector);
app.use('/admin', routes.library);

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// ==================== SPA NAVIGATION HANDLER ====================
// Handle student/admin page refreshes by serving index.html for non-API GET requests
app.get('*', (req, res) => {
    // If it's a browser navigation (GET + Accept: text/html)
    // AND it's not a known backend document/action route
    if (req.method === 'GET' &&
        req.headers.accept?.includes('text/html') &&
        !req.xhr &&
        !req.path.includes('.') &&
        !req.path.includes('/logout') &&
        !req.path.includes('/download-certificate')) {
        return res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    }

    // Default 404 for actual missing resources or API endpoints
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        console.log(`[404 API] ${req.method} ${req.url} - Not Found`);
        return res.status(404).json({ success: false, message: 'Route not found' });
    }

    console.log(`[404 PAGE] ${req.method} ${req.url} - Not Found`);
    res.status(404).send('Not Found');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🚨 Global Error Handler:', err.stack);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


// ==================== SERVER INITIALIZATION ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🎓 DBU CLEARANCE SYSTEM - SERVER STARTED');
    console.log('='.repeat(50));
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    // dbConfig is now encapsulated in config/db.js
    console.log('='.repeat(50));
    console.log(`👨‍🎓 Student Login: http://localhost:${PORT}/login`);
    console.log(`👨‍💼 Admin Login: http://localhost:${PORT}/admin/login`);
    console.log(`🏠 Homepage: http://localhost:${PORT}`);
    console.log('='.repeat(50) + '\n');
});

// ==================== GRACEFUL SHUTDOWN HANDLER ====================
process.on('SIGINT', async () => {
    console.log('\n🔻 Received SIGINT - Shutting down gracefully...');

    try {
        await pool.end();
        console.log('✅ Database connections closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🔻 Received SIGTERM - Shutting down gracefully...');

    try {
        await pool.end();
        console.log('✅ Database connections closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

module.exports = app; // For testing purposes