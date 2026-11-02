const supabase = require('../config/supabase');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');

// ── Create new order ─────────────────────────────────────────────
exports.newOrder = asyncErrorHandler(async (req, res, next) => {
  const { shippingInfo, orderItems, paymentInfo, totalPrice } = req.body;

  // prevent duplicate orders for same payment
  const { data: existing } = await supabase
    .from('orders').select('id').eq('payment_info->>id', paymentInfo.id).maybeSingle();
  if (existing) return next(new ErrorHandler('Order already placed', 400));

  const { data: order, error } = await supabase.from('orders').insert([{
    user_id: req.user.id,
    shipping_info: shippingInfo,
    order_items: orderItems,
    payment_info: paymentInfo,
    paid_at: new Date().toISOString(),
    total_price: totalPrice,
    order_status: 'Processing',
  }]).select().single();

  if (error) return next(new ErrorHandler(error.message, 400));

  await sendEmail({
    email: req.user.email,
    templateId: process.env.SENDGRID_ORDER_TEMPLATEID,
    data: { name: req.user.name, shippingInfo, orderItems, totalPrice, oid: order.id },
  });

  res.status(201).json({ success: true, order });
});

// ── Get single order ─────────────────────────────────────────────
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, users(name, email)')
    .eq('id', req.params.id)
    .single();

  if (error || !order) return next(new ErrorHandler('Order not found', 404));
  res.status(200).json({ success: true, order });
});

// ── My orders ────────────────────────────────────────────────────
exports.myOrders = asyncErrorHandler(async (req, res, next) => {
  const { data: orders, error } = await supabase
    .from('orders').select('*').eq('user_id', req.user.id);
  if (error) return next(new ErrorHandler('Orders not found', 404));
  res.status(200).json({ success: true, orders });
});

// ── ADMIN: get all orders ────────────────────────────────────────
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
  const { data: orders, error } = await supabase.from('orders').select('*, users(name, email)');
  if (error) return next(new ErrorHandler(error.message, 500));

  const totalAmount = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  res.status(200).json({ success: true, orders, totalAmount });
});

// ── ADMIN: update order status ───────────────────────────────────
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {
  const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
  if (!order) return next(new ErrorHandler('Order not found', 404));
  if (order.order_status === 'Delivered') return next(new ErrorHandler('Already delivered', 400));

  const updates = { order_status: req.body.status };

  if (req.body.status === 'Shipped') {
    updates.shipped_at = new Date().toISOString();
    // decrement stock for each item
    for (const item of order.order_items) {
      const { data: product } = await supabase.from('products').select('stock').eq('id', item.product).single();
      if (product) {
        await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.product);
      }
    }
  }

  if (req.body.status === 'Delivered') updates.delivered_at = new Date().toISOString();

  await supabase.from('orders').update(updates).eq('id', req.params.id);
  res.status(200).json({ success: true });
});

// ── ADMIN: delete order ──────────────────────────────────────────
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {
  const { data: order } = await supabase.from('orders').select('id').eq('id', req.params.id).single();
  if (!order) return next(new ErrorHandler('Order not found', 404));
  await supabase.from('orders').delete().eq('id', req.params.id);
  res.status(200).json({ success: true });
});
