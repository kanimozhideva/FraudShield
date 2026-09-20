const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fraud_detection';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/fraud', require('./routes/fraud'));
app.use('/api/reports', require('./routes/fraud'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.send('FraudShield AI API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));