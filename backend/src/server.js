const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Taskey Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
