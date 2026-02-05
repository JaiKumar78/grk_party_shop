// controllers/paymentController.js
import instance from '../config/razorpayConfig.js'; // Use the pre-configured Razorpay instance
import Order from '../models/orderModel.js';
import User from '../models/userModel.js'; // To update user's orders and clear cart
import Product from '../models/productModel.js'; // To update product stock
import Store from '../models/storeModel.js'; // NEW: Import Store model
import crypto from 'crypto'; // For signature verification
import nodemailer from 'nodemailer'; // For sending email notifications
import dotenv from 'dotenv';
import mongoose from 'mongoose'; // For ObjectId validation
import { createOrFindUserFromOrderData } from '../services/userService.js'; // Import user service

dotenv.config(); // Load environment variables

// Helper to generate a unique order oid
function generateOrderOid() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `GRK-${date}-${time}-${random}`;
}

// Helper to create or find user from guest order data using user service
async function createOrFindUserFromOrder(customerDetails, shippingAddress) {
  return await createOrFindUserFromOrderData(customerDetails, shippingAddress);
}

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- Email Sending Function ---
const sendOrderConfirmationEmail = async (order, recipientEmail, isToCustomer = true) => {
    let subject;
    let htmlContent;

    // Populate pickupStore details if available
    const populatedOrder = await order.populate('pickupStore');

    let deliveryDetailsHtml = '';
    if (populatedOrder.deliveryMethod === 'Courier') {
        deliveryDetailsHtml = `
            <p><strong>Shipping Address:</strong></p>
            <p>
                ${populatedOrder.fullName}<br/>
                ${populatedOrder.shippingAddress.apartment ? `${populatedOrder.shippingAddress.apartment}, ` : ''}
                ${populatedOrder.shippingAddress.street}<br/>
                ${populatedOrder.shippingAddress.city}, ${populatedOrder.shippingAddress.state} - ${populatedOrder.shippingAddress.postalCode}<br/>
                ${populatedOrder.shippingAddress.country}<br/>
                ${populatedOrder.mobileNo ? `Mobile: ${populatedOrder.mobileNo}<br/>` : ''}
                Email: ${populatedOrder.customerEmail}
            </p>
        `;
    } else if (populatedOrder.deliveryMethod === 'Store Pickup' && populatedOrder.pickupStore) {
        deliveryDetailsHtml = `
            <p><strong>Pickup Location:</strong></p>
            <p>
                <strong>${populatedOrder.pickupStore.name}</strong><br/>
                ${populatedOrder.pickupStore.address.street}<br/>
                ${populatedOrder.pickupStore.address.apartment ? `${populatedOrder.pickupStore.address.apartment}, ` : ''}
                ${populatedOrder.pickupStore.address.city}, ${populatedOrder.pickupStore.address.state} - ${populatedOrder.pickupStore.address.postalCode}<br/>
                ${populatedOrder.pickupStore.address.country}<br/>
                Phone: ${populatedOrder.pickupStore.phone}<br/>
                Email: ${populatedOrder.pickupStore.email}
            </p>
            <p>Customer: ${populatedOrder.fullName}<br/>
               ${populatedOrder.mobileNo ? `Mobile: ${populatedOrder.mobileNo}<br/>` : ''}
               Email: ${populatedOrder.customerEmail}
            </p>
        `;
    }

    const orderItemsHtml = `
        <ul>
            ${populatedOrder.orderItems.map(item => `
                <li>${item.name}${item.variantSku ? ` (${item.variantSku})` : ''} (Qty: ${item.quantity}) - INR ${(item.price * item.quantity).toFixed(2)}</li>
            `).join('')}
        </ul>
    `;

    if (isToCustomer) {
        subject = `Your Order #${populatedOrder.oid} Confirmation - GRK Party Shop`;
    } else {
        subject = `New Order Placed: #${populatedOrder.oid}`;
    }
    htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #e5e7eb; padding: 32px;">
          <h2 style="color: #ec4899; text-align: center; margin-bottom: 24px;">
            ${isToCustomer ? 'Thank you for your order!' : 'New Order Notification'}
          </h2>
          <p style="font-size: 16px; color: #374151;">
            ${isToCustomer
              ? `Dear <strong>${populatedOrder.fullName}</strong>,<br>Your payment has been received and your order <strong>#${populatedOrder.oid}</strong> is being processed.`
              : `A new order has been placed on your store!`}
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <h3 style="color: #1e293b; margin-bottom: 8px;">Order Details</h3>
          <table style="width: 100%; font-size: 15px; color: #374151; margin-bottom: 16px;">
            <tr>
              <td style="padding: 4px 0;"><strong>Order ID:</strong></td>
              <td style="padding: 4px 0;">${populatedOrder.oid}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Order Date:</strong></td>
              <td style="padding: 4px 0;">${new Date(populatedOrder.createdAt).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Customer:</strong></td>
              <td style="padding: 4px 0;">${populatedOrder.fullName} (${populatedOrder.customerEmail})</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Order Status:</strong></td>
              <td style="padding: 4px 0;">${populatedOrder.orderStatus}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Delivery Method:</strong></td>
              <td style="padding: 4px 0;">${populatedOrder.deliveryMethod}</td>
            </tr>
          </table>
          <h3 style="color: #1e293b; margin-bottom: 8px;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Product</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Qty</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Price</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${populatedOrder.orderItems.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">
                    ${item.name}
                    ${item.variantAttributes && Object.keys(item.variantAttributes).length > 0
                      ? `<div style='font-size:12px; color:#6b7280;'>${Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>`
                      : ''}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.quantity}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">INR ${item.price.toFixed(2)}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">INR ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <table style="width: 100%; font-size: 15px; color: #374151; margin-bottom: 24px;">
            ${(populatedOrder.deliveryMethod !== 'Store Pickup') ? `
              <tr>
                <td style="padding: 4px 0;"><strong>Shipping:</strong></td>
                <td style="padding: 4px 0;">INR ${(populatedOrder.shippingPrice || 0).toFixed(2)}</td>
              </tr>
            ` : ''}
            ${populatedOrder.taxPrice ? `
              <tr>
                <td style="padding: 4px 0;"><strong>Tax:</strong></td>
                <td style="padding: 4px 0;">INR ${populatedOrder.taxPrice.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0;"><strong>Total:</strong></td>
              <td style="padding: 4px 0;"><strong>INR ${populatedOrder.totalPrice.toFixed(2)}</strong></td>
            </tr>
          </table>
          ${populatedOrder.deliveryMethod === 'Store Pickup' && populatedOrder.pickupStore ? `
            <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #1e293b;">Pickup Store Details</h4>
              <div><strong>${populatedOrder.pickupStore.name}</strong></div>
              <div>${populatedOrder.pickupStore.address.street}</div>
              <div>${populatedOrder.pickupStore.address.city}, ${populatedOrder.pickupStore.address.state} - ${populatedOrder.pickupStore.address.postalCode}</div>
              <div>${populatedOrder.pickupStore.address.country}</div>
              <div>Phone: ${populatedOrder.pickupStore.phone}</div>
              <div>Email: ${populatedOrder.pickupStore.email}</div>
              <div style="margin-top: 8px; color: #ec4899;">Please bring your order ID and a valid ID proof when collecting your order.</div>
            </div>
          ` : ''}
          ${populatedOrder.deliveryMethod === 'Courier' && populatedOrder.deliverySpeed === 'quick' ? `
            <div style="background: #fef2f2; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #be123c;">Quick Delivery</h4>
              <div>Your order will be delivered within <strong>same day</strong>.</div>
              <div style="margin-top: 8px;">
                <strong>Delivery Address:</strong><br>
                ${populatedOrder.fullName}<br>
                ${populatedOrder.shippingAddress.apartment ? populatedOrder.shippingAddress.apartment + ', ' : ''}
                ${populatedOrder.shippingAddress.street}<br>
                ${populatedOrder.shippingAddress.city}, ${populatedOrder.shippingAddress.state} ${populatedOrder.shippingAddress.postalCode}<br>
                ${populatedOrder.shippingAddress.country}
              </div>
              <div style="margin-top: 8px; color: #be123c;">You'll receive email updates about your delivery status.</div>
            </div>
          ` : ''}
          ${populatedOrder.deliveryMethod === 'Courier' && populatedOrder.deliverySpeed !== 'quick' ? `
            <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #166534;">Standard Delivery</h4>
              <div>Your order will be delivered within <strong>2-3 working days</strong>.</div>
              <div style="margin-top: 8px;">
                <strong>Delivery Address:</strong><br>
                ${populatedOrder.fullName}<br>
                ${populatedOrder.shippingAddress.apartment ? populatedOrder.shippingAddress.apartment + ', ' : ''}
                ${populatedOrder.shippingAddress.street}<br>
                ${populatedOrder.shippingAddress.city}, ${populatedOrder.shippingAddress.state} ${populatedOrder.shippingAddress.postalCode}<br>
                ${populatedOrder.shippingAddress.country}
              </div>
              <div style="margin-top: 8px; color: #166534;">You'll receive tracking updates via email.</div>
            </div>
          ` : ''}
          <div style="margin-top: 24px; color: #64748b; font-size: 14px;">
            ${isToCustomer
              ? `You will receive another email when your order status changes from <strong>${populatedOrder.orderStatus}</strong>.<br>Thank you for shopping with GRK Party Shop!`
              : `Please log in to the admin panel to manage this order.`}
          </div>
          <div style="margin-top: 32px; text-align: center; color: #ec4899; font-weight: bold;">
            GRK Party Shop
          </div>
        </div>
      </div>
    `;

    try {
        await transporter.sendMail({
            from: `"GRK Party Shop" <${process.env.EMAIL_USER || 'noreply@example.com'}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlContent,
        });
        
    } catch (error) {
        console.error(`Failed to send email to ${recipientEmail}:`, error);
    }
};

// --- Helper function to validate and prepare order data ---
const validateAndPrepareOrderData = async (cartItems) => {
    let itemsPrice = 0;
    const orderItems = [];
    const stockValidationErrors = [];

    for (const item of cartItems) {
        // First try to find a simple product
        let product = await Product.findById(item.product);
        
        // If not found, it might be a variant ID - search for product containing this variant
        if (!product) {
            product = await Product.findOne({ 'variants._id': item.product });
            if (!product) {
                stockValidationErrors.push(`Product not found for item: ${item.product}`);
                continue;
            }
            
            // Find the specific variant
            const variant = product.variants.find(v => v._id.toString() === item.product);
            if (!variant) {
                stockValidationErrors.push(`Product variant not found: ${item.product}`);
                continue;
            }
            
            // Check variant stock
            if (variant.stock < item.quantity) {
                stockValidationErrors.push(`Insufficient stock for ${product.name} (${variant.sku}). Available: ${variant.stock}, Requested: ${item.quantity}`);
                continue;
            }
            
            itemsPrice += variant.price * item.quantity;
            const orderItem = {
                product: product._id, // Store parent product ID
                variantId: variant._id, // Store variant ID for stock reduction
                name: product.name,
                variantSku: variant.sku,
                quantity: item.quantity,
                price: variant.price,
                image: variant.images && variant.images.length > 0 ? variant.images[0].url : 'https://placehold.co/400x400/cccccc/333333?text=No+Image',
                variantAttributes: item.attributes || {},
            };
            orderItems.push(orderItem);
        } else {
            // Simple product
            if (product.stock < item.quantity) {
                stockValidationErrors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                continue;
            }
            itemsPrice += product.price * item.quantity;
            const orderItem = {
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0].url : 'https://placehold.co/400x400/cccccc/333333?text=No+Image',
                variantAttributes: item.attributes || {},
            };
            orderItems.push(orderItem);
        }
    }

    if (stockValidationErrors.length > 0) {
        throw new Error(`Stock validation failed: ${stockValidationErrors.join('; ')}`);
    }

    return { itemsPrice, orderItems };
};

// @desc    Process payment - Create Razorpay order and verify payment in one flow
// @route   POST /api/payment/process-payment
// @access  Public (User or Guest)
export const processPayment = async (req, res) => {
    try {
        const { 
            amount, 
            currency, 
            cartItems, 
            customerDetails, 
            shippingAddress, 
            deliveryMethod, 
            pickupStore,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;
        
        // Use userId from req.user if present, otherwise null (guest)
        const userId = req.user ? req.user._id : null;

        // If this is the initial request (no payment verification data)
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            // Step 1: Validate and prepare order data
            const { itemsPrice, orderItems } = await validateAndPrepareOrderData(
                cartItems, customerDetails, shippingAddress, deliveryMethod, pickupStore
            );

            // Calculate shipping and tax based on frontend logic
            const shippingPrice = req.body.shippingPrice || 0; // Get from frontend
            const taxPrice = req.body.taxPrice || 0; // Get from frontend, no fallback calculation
            const totalPrice = amount || itemsPrice + shippingPrice + taxPrice;

            // Step 2: Create Razorpay order
            let guestInitials = '';
            if (!userId && customerDetails) {
                const nameSource = customerDetails.fullName || `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim();
                if (nameSource) {
                    const parts = nameSource.split(' ').filter(Boolean);
                    const first = parts[0] || '';
                    const last = parts.slice(1).join(' ') || first;
                    guestInitials = `${first[0] || ''}${last[0] || ''}`;
                }
            }
            const receiptStr = `r_${Date.now()}_${userId ? userId.toString().slice(-6) : guestInitials}`.slice(0, 40);
            const notesUser = userId ? userId.toString() : guestInitials;
            const options = {
                amount: Math.round(totalPrice * 100),
                currency,
                receipt: receiptStr,
                notes: { userId: notesUser },
            };
            
            const razorpayOrder = await instance.orders.create(options);

            // Step 3: Return Razorpay order details for frontend payment
            res.status(200).json({
                success: true,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderData: {
                    itemsPrice,
                    shippingPrice,
                    taxPrice,
                    totalPrice,
                    orderItems,
                    customerDetails,
                    shippingAddress,
                    deliveryMethod,
                    pickupStore
                }
            });
        } else {
            // Step 4: Payment verification and order creation
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({ message: 'Missing Razorpay payment verification details.' });
            }

            // Verify Razorpay signature
            const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const digest = shasum.digest('hex');

            if (digest !== razorpay_signature) {
                return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature.' });
            }

            // Extract order data from request body
            const { 
                itemsPrice, 
                shippingPrice, 
                taxPrice, 
                totalPrice, 
                orderItems, 
                customerDetails, 
                shippingAddress, 
                deliveryMethod, 
                pickupStore 
            } = req.body;

            // If the data is nested in orderData (from frontend), extract it
            const orderData = req.body.orderData || {};
            const finalItemsPrice = itemsPrice || orderData.itemsPrice;
            const finalShippingPrice = shippingPrice || orderData.shippingPrice;
            const finalTaxPrice = taxPrice || orderData.taxPrice;
            const finalTotalPrice = totalPrice || orderData.totalPrice;
            const finalOrderItems = orderItems || orderData.orderItems;
            const finalCustomerDetails = customerDetails || orderData.customerDetails;
            const finalShippingAddress = shippingAddress || orderData.shippingAddress;
            const finalDeliveryMethod = deliveryMethod || orderData.deliveryMethod;
            const finalPickupStore = pickupStore || orderData.pickupStore;

            // Validate required fields
            if (!finalOrderItems || finalOrderItems.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required order data: orderItems' 
                });
            }

            // Calculate itemsPrice from orderItems if not provided
            const calculatedItemsPrice = finalItemsPrice || finalOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Validate order items have required fields
            for (const item of finalOrderItems) {
                if (!item.price || !item.name || !item.quantity) {
                    console.error('Invalid order item:', item);
                    return res.status(400).json({ 
                        success: false, 
                        message: `Missing required fields in order item: ${item.name || 'unknown'}. Price: ${item.price}, Quantity: ${item.quantity}` 
                    });
                }
            }

            // Ensure we have valid customer details
            if (!finalCustomerDetails || !(finalCustomerDetails.fullName || finalCustomerDetails.firstName) || !finalCustomerDetails.email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required customer details' 
                });
            }

            // Step 5: Create or find user for guest orders, or update existing user data
            let finalUserId = userId;
            if (!userId) {
                // Create user account from guest order data
                const user = await createOrFindUserFromOrder(finalCustomerDetails, finalShippingAddress);
                finalUserId = user._id;
            } else {
                // Update existing logged-in user's data with form changes
                const user = await User.findById(userId);
                if (user) {
                    let updated = false;
                    
                    // Update name if provided
                    if (finalCustomerDetails.fullName || (finalCustomerDetails.firstName && finalCustomerDetails.lastName)) {
                        const newName = (finalCustomerDetails.fullName ||
                            `${finalCustomerDetails.firstName} ${finalCustomerDetails.lastName}`).trim();
                        if (newName && user.name !== newName) {
                            user.name = newName;
                            updated = true;
                        }
                    }
                    
                    // Update phone if provided
                    if (finalCustomerDetails.mobileNo && user.phone !== finalCustomerDetails.mobileNo) {
                        user.phone = finalCustomerDetails.mobileNo;
                        updated = true;
                    }
                    
                    // Update address if provided and different
                    if (finalShippingAddress && finalShippingAddress.street) {
                        const newAddress = {
                            street: finalShippingAddress.street || '',
                            city: finalShippingAddress.city || '',
                            state: finalShippingAddress.state || '',
                            postalCode: finalShippingAddress.postalCode || ''
                        };
                        
                        // Check if address is different
                        if (!user.address || 
                            user.address.street !== newAddress.street ||
                            user.address.city !== newAddress.city ||
                            user.address.state !== newAddress.state ||
                            user.address.postalCode !== newAddress.postalCode) {
                            user.address = newAddress;
                            updated = true;
                        }
                    }
                    
                    if (updated) {
                        await user.save();
                    }
                }
            }

            // Step 6: Create the actual order in database
            const order = new Order({
                user: finalUserId, // Link to created/found user
                fullName: (finalCustomerDetails.fullName ||
                    `${finalCustomerDetails.firstName || ''} ${finalCustomerDetails.lastName || ''}`.trim()),
                customerEmail: finalCustomerDetails.email,
                mobileNo: finalCustomerDetails.mobileNo,
                orderItems: finalOrderItems,
                shippingAddress: finalShippingAddress,
                deliveryMethod: finalDeliveryMethod,
                pickupStore: finalDeliveryMethod === 'Store Pickup' ? finalPickupStore : null,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                itemsPrice: calculatedItemsPrice,
                shippingPrice: finalShippingPrice || 0,
                taxPrice: finalTaxPrice || 0, // Only use provided tax price, no fallback
                totalPrice: finalTotalPrice || (calculatedItemsPrice + (finalShippingPrice || 0) + (finalTaxPrice || 0)),
                isPaid: true,
                paidAt: Date.now(),
                orderStatus: 'Processing',
                oid: generateOrderOid(), // Add generated oid
                deliverySpeed: req.body.quickDelivery ? 'quick' : 'normal',
            });
            await order.save();

            // Step 7: Add order to user's orders array
            if (finalUserId) {
                const user = await User.findById(finalUserId);
                if (user) {
                    user.orders.push(order._id);
                    await user.save();
                }
            }

            // Step 8: Reduce stock
            const bulkOps = [];
            for (const item of finalOrderItems) {
                if (item.variantId) {
                    // Reduce variant stock
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: item.product, 'variants._id': item.variantId },
                            update: { $inc: { 'variants.$.stock': -item.quantity } }
                        }
                    });
                } else {
                    // Reduce simple product stock
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: item.product },
                            update: { $inc: { stock: -item.quantity } }
                        }
                    });
                }
            }
            await Product.bulkWrite(bulkOps);

            // Step 9: Empty user cart if signed in
            if (finalUserId) {
                const user = await User.findById(finalUserId);
                if (user) {
                    user.cart = [];
                    await user.save();
                }
            }

            // Step 10: Send email notifications
            try {
                // Send to customer
                await sendOrderConfirmationEmail(order, order.customerEmail, true);
                // Send to store owner (you can add store owner email here)
                await sendOrderConfirmationEmail(order, process.env.EMAIL_ADMIN, false);
            } catch (emailError) {
                console.error('Failed to send order confirmation emails:', emailError);
                // Don't fail the order for email errors
            }

            res.status(200).json({ 
                success: true, 
                message: 'Payment verified and order created successfully', 
                orderId: order._id 
            });
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ 
            message: error.message || 'Could not process payment',
            success: false 
        });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/payment/myorders
// @access  Private (User)
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
                                  .populate({
                                      path: 'orderItems.product',
                                      select: 'name price images'
                                  })
                                  .populate('pickupStore', 'name address phone email') // Populate pickup store details
                                  .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: error.message || 'Server Error: Could not fetch orders' });
    }
};

// @desc    Get order by ID
// @route   GET /api/payment/orders/:orderId
// @access  Private (User/Admin)
export const getOrderById = async (req, res) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }

    try {
        const order = await Order.findById(orderId)
                                 .populate('user', 'name email')
                                 .populate({
                                     path: 'orderItems.product',
                                     select: 'name price images'
                                 })
                                 .populate('pickupStore', 'name address phone email'); // Populate pickup store details

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Only restrict if the order has a user (registered user order)
        if (order.user && req.user) {
            if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this order.' });
            }
        }
        // If order.user is null (guest order), allow access

        res.status(200).json(order);
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ message: error.message || 'Server Error: Could not fetch order' });
    }
};

// @desc    Update order status
// @route   PUT /api/payment/orders/:orderId/status
// @access  Admin
export const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body; // Expecting 'Processing', 'Shipped', or 'Delivered'

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const validStatuses = ['Processing', 'Shipped', 'Delivered'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ message: 'Invalid order status provided.' });
    }

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.orderStatus === newStatus) {
            return res.status(200).json({ message: `Order is already in status '${newStatus}'`, order });
        }

        order.orderStatus = newStatus;
        // If you had a 'deliveredAt' field and wanted to set it on 'Delivered' status
        // if (newStatus === 'Delivered') {
        //     order.deliveredAt = Date.now();
        // }

        const updatedOrder = await order.save();
        res.status(200).json({ message: `Order status updated to '${newStatus}'`, order: updatedOrder });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: error.message || 'Server Error: Could not update order status' });
    }
};

// @desc    Get all orders (for admin) with search, filter, and sort
// @route   GET /api/payment/orders
// @access  Admin
export const getAllOrders = async (req, res) => {
    try {
        const { search, status, sort } = req.query;
        const query = {};

        // Only filter by status if it's a valid status
        const validStatuses = ['Processing', 'Shipped', 'Delivered'];
        if (status && validStatuses.includes(status)) {
            query.orderStatus = status;
        }

        // Search by order ID (oid), MongoDB _id, customer name, or email
        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search, 'i');
            let orArr = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { customerEmail: searchRegex },
                { oid: searchRegex }, // Search by custom order ID (oid)
            ];
            // If valid ObjectId, add _id search
            if (search.match(/^[a-fA-F0-9]{24}$/)) {
                orArr.unshift({ _id: search });
            }
            query.$or = orArr;
        }

        // Sorting
        let sortObj = { createdAt: -1 }; // Default: newest first
        if (sort === 'oldest') sortObj = { createdAt: 1 };
        if (sort === 'total-high-low') sortObj = { totalPrice: -1 };
        if (sort === 'total-low-high') sortObj = { totalPrice: 1 };

        const orders = await Order.find(query)
            .populate('user', 'id name email')
            .populate('pickupStore', 'name address phone email')
            .sort(sortObj);

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ message: error.message || 'Server Error: Could not fetch all orders' });
    }
};


