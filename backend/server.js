const dotenv = require('dotenv');
const express = require('express');
const colors = require('colors');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config(); 
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use('/api/auth', authRoutes);
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/product", require("./routes/productRoutes"));
app.use('/api/review', require('./routes/reviewRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));        
app.use('/api/order',    require('./routes/orderRoutes'));       
app.use('/api/delivery', require('./routes/deliveryRoutes'));
// Add this in server.js alongside your other routes
app.use('/api/payment', require('./routes/paymentRoutes'));
app.get('/', (req, res)=> {
    res.send('<h1>welcome to ecommerce api</h1>');
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});