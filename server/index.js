import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import connectDB from './config/mongo.js'
import productRoutes from './routes/productRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import userRoutes from './routes/userRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'

import cloudinaryConnect from './config/cloudinary.js'
import storeRoutes from './routes/storeRoutes.js'
import { configureCORS, configureHelmet, generalLimiter } from './middleware/security.js'

dotenv.config()

const app = express();

// Security middleware - Apply before other middleware
app.use(configureHelmet()); // Security headers
app.use(cors(configureCORS())); // CORS with allowed origins
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL encoded parser

// General rate limiting for all routes
app.use(generalLimiter);

//routes
app.get("/", (req, res) => {
  res.send("🎉 Party Shop Backend is Running");
});
app.use('/api/product', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/stores', storeRoutes);

const PORT = process.env.PORT || 5000

const startServer = () => {
    try{
        connectDB();
        cloudinaryConnect();
        app.listen(PORT, () => {
            console.log("server running on port", PORT)
        })
    }
    catch(error){
        console.log(error);
    }
}

startServer();