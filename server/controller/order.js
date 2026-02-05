import orderModel from "../models/orderModel.js";
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import User from '../models/userModel.js';

// Email config (replace with your SMTP details)
const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your@email.com',
        pass: 'yourpassword',
    },
});

const OWNER_EMAIL = 'owner@email.com'; // Change to your admin/owner email

// Placeholder for WhatsApp notification (implement with Twilio or other API)
const sendWhatsAppNotification = async (to, message) => {
    // Implement WhatsApp API integration here
    // Example: Use Twilio API to send WhatsApp message
    // await twilioClient.messages.create({
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${to}`,
    //   body: message,
    // });
    return true;
};

// Helper: Verify Razorpay signature
const verifyRazorpaySignature = (orderId, paymentId, signature, keySecret) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
};

// Helper to generate a unique order oid
function generateOrderOid() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `GRK-${date}-${time}-${random}`;
}

export const createOrder = async (req, res) => {
    try{
        // Accept all fields, including new ones
        const {
            user,
            fullName,
            customerEmail,
            mobileNo,
            orderItems,
            shippingAddress,
            deliveryMethod,
            pickupStore,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            isPaid,
            paidAt,
            orderStatus,
            orderNotes,
            paymentMethod,
        } = req.body;

        // Ensure variantAttributes are included in each orderItem if present
        const processedOrderItems = orderItems.map(item => ({
            ...item,
            variantAttributes: item.variantAttributes || undefined,
        }));

        const newOrder = new orderModel({
            user,
            fullName,
            customerEmail,
            mobileNo,
            orderItems: processedOrderItems,
            shippingAddress,
            deliveryMethod,
            pickupStore,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            isPaid,
            paidAt,
            orderStatus,
            orderNotes,
            paymentMethod,
            oid: generateOrderOid(), // Add generated oid
        });
        await newOrder.save();

        // --- Add order to user's orders array ---
        if (user) {
            await User.findByIdAndUpdate(
                user,
                { $push: { orders: newOrder._id } },
                { new: true }
            );
        }

        // --- Email Notification ---
        const orderSummary = processedOrderItems.map(item =>
            `${item.name} x${item.quantity} - ₹${item.price} ${item.variantAttributes ? '(' + Object.values(item.variantAttributes).join(', ') + ')' : ''}`
        ).join('\n');

        const emailBody = `New Order Placed!\n\nCustomer: ${fullName}\nEmail: ${customerEmail}\nMobile: ${mobileNo}\n\nOrder Items:\n${orderSummary}\n\nTotal: ₹${totalPrice}\n\nNotes: ${orderNotes || 'N/A'}`;

        // Send to owner
        await transporter.sendMail({
            from: 'no-reply@yourshop.com',
            to: OWNER_EMAIL,
            subject: 'New Order Placed',
            text: emailBody,
        });
        // Send to consumer
        await transporter.sendMail({
            from: 'no-reply@yourshop.com',
            to: customerEmail,
            subject: 'Your Order Confirmation',
            text: `Thank you for your order!\n\n${emailBody}`,
        });

        // --- WhatsApp Notification (placeholder) ---
        // await sendWhatsAppNotification(ownerPhone, `New order placed by ${firstName} ${lastName}. Total: ₹${totalPrice}`);
        // await sendWhatsAppNotification(mobileNo, `Thank you for your order! Total: ₹${totalPrice}`);

        res.status(201).json({ message: 'Order created successfully', newOrder });
    }
    catch(error){
        console.log(error)
        res.status(400).json({ message: 'Error placing Order', error: error.message });
    }
}

export const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find();
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
}

export const getUserOrder = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware
        const orders = await orderModel.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user orders', error: error.message });
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!['Processing', 'Shipped', 'Delivered'].includes(status)) {
        return res.status(400).json({ message: 'Invalid delivery status' });
        }

        const order = await orderModel.findByIdAndUpdate(
        orderId,
        { deliveryStatus: status },
        { new: true }
        );

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json({ message: 'Delivery status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update delivery status', error: error.message });
    }
}

// export const cancelOrder = () => {

// }

export const getOrderbyId = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    }
    catch (error) {
        res.status(400).json({ message: 'Error fetching product', error: error.message });
    }
}

export const removeOrder = () => {

}

// POST /api/orders/verify-payment
export const verifyOrderPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }
    // Get your Razorpay key secret from env
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ message: 'Server misconfiguration: missing Razorpay key secret' });
    }
    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
    // Update order as paid
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.isPaid = true;
    order.paidAt = new Date();
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // --- Email Notification ---
    const orderSummary = order.orderItems.map(item =>
      `${item.name} x${item.quantity} - ₹${item.price} ${item.variantAttributes ? '(' + Object.values(item.variantAttributes).join(', ') + ')' : ''}`
    ).join('\n');
    const emailBody = `New Order Placed!\n\nCustomer: ${order.fullName}\nEmail: ${order.customerEmail}\nMobile: ${order.mobileNo}\n\nOrder Items:\n${orderSummary}\n\nTotal: ₹${order.totalPrice}\n\nNotes: ${order.orderNotes || 'N/A'}`;
    // Send to owner
    await transporter.sendMail({
      from: 'no-reply@yourshop.com',
      to: OWNER_EMAIL,
      subject: 'New Order Placed',
      text: emailBody,
    });
    // Send to consumer
    await transporter.sendMail({
      from: 'no-reply@yourshop.com',
      to: order.customerEmail,
      subject: 'Your Order Confirmation',
      text: `Thank you for your order!\n\n${emailBody}`,
    });
    // --- WhatsApp Notification (placeholder) ---
    // await sendWhatsAppNotification(ownerPhone, `New order placed by ${order.firstName} ${order.lastName}. Total: ₹${order.totalPrice}`);
    // await sendWhatsAppNotification(order.mobileNo, `Thank you for your order! Total: ₹${order.totalPrice}`);

    res.status(200).json({ message: 'Payment verified and order updated', order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};