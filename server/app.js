const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// CORS — allow React dev server, local network, and same-origin production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost on any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) {
      return callback(null, true);
    }
    // Allow configured CLIENT_URL
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');
const game = require('./routes/gameRoute');
const profile = require('./routes/profileRoute');

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);
app.use('/api/v1', game);
app.use('/api/v1', profile);

// Global error handler — must be last middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV === 'development') {
        console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
});

app.get('/', (req, res) => {
    res.json({ success: true, message: 'MetaRace API is running' });
});

module.exports = app;
