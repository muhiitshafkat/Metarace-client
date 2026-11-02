const supabase = require('../config/supabase');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const cloudinary = require('cloudinary');

// ── Get all products (with search, filter, pagination) ───────────
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
  const resultPerPage = 12;
  const { keyword, category, page = 1, 'price[gte]': priceMin, 'price[lte]': priceMax } = req.query;

  let query = supabase.from('products').select('*', { count: 'exact' });

  if (keyword) query = query.ilike('name', `%${keyword}%`);
  if (category) query = query.eq('category', category);
  if (priceMin) query = query.gte('price', priceMin);
  if (priceMax) query = query.lte('price', priceMax);

  // total count before pagination
  const { count: productsCount } = await query;

  const from = (page - 1) * resultPerPage;
  const to = from + resultPerPage - 1;
  query = query.range(from, to);

  const { data: products, error } = await query;
  if (error) return next(new ErrorHandler(error.message, 500));

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount: products.length,
  });
});

// ── Get all products (slider / no pagination) ────────────────────
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) return next(new ErrorHandler(error.message, 500));
  res.status(200).json({ success: true, products });
});

// ── Get single product ───────────────────────────────────────────
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
  const { data: product, error } = await supabase
    .from('products').select('*, reviews(*)').eq('id', req.params.id).single();
  if (error || !product) return next(new ErrorHandler('Product not found', 404));
  res.status(200).json({ success: true, product });
});

// ── ADMIN: get all products ──────────────────────────────────────
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) return next(new ErrorHandler(error.message, 500));
  res.status(200).json({ success: true, products });
});

// ── ADMIN: create product ────────────────────────────────────────
exports.createProduct = asyncErrorHandler(async (req, res, next) => {
  // Upload images
  let images = typeof req.body.images === 'string' ? [req.body.images] : req.body.images;
  const imagesLink = [];
  for (const img of images) {
    const result = await cloudinary.v2.uploader.upload(img, { folder: 'products' });
    imagesLink.push({ public_id: result.public_id, url: result.secure_url });
  }

  // Upload brand logo
  const logoResult = await cloudinary.v2.uploader.upload(req.body.logo, { folder: 'brands' });

  const specs = req.body.specifications.map((s) => (typeof s === 'string' ? JSON.parse(s) : s));

  const { data: product, error } = await supabase.from('products').insert([{
    name: req.body.name,
    description: req.body.description,
    highlights: req.body.highlights,
    specifications: specs,
    price: req.body.price,
    cutted_price: req.body.cuttedPrice,
    images: imagesLink,
    brand_name: req.body.brandname,
    brand_logo_id: logoResult.public_id,
    brand_logo_url: logoResult.secure_url,
    category: req.body.category,
    stock: req.body.stock,
    warranty: req.body.warranty,
    user_id: req.user.id,
  }]).select().single();

  if (error) return next(new ErrorHandler(error.message, 400));
  res.status(201).json({ success: true, product });
});

// ── ADMIN: update product ────────────────────────────────────────
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
  const { data: product } = await supabase.from('products').select('*').eq('id', req.params.id).single();
  if (!product) return next(new ErrorHandler('Product not found', 404));

  const updates = {};

  // Re-upload images if provided
  if (req.body.images !== undefined) {
    let images = typeof req.body.images === 'string' ? [req.body.images] : req.body.images;
    for (const img of product.images) await cloudinary.v2.uploader.destroy(img.public_id);
    const imagesLink = [];
    for (const img of images) {
      const result = await cloudinary.v2.uploader.upload(img, { folder: 'products' });
      imagesLink.push({ public_id: result.public_id, url: result.secure_url });
    }
    updates.images = imagesLink;
  }

  // Re-upload brand logo if provided
  if (req.body.logo?.length > 0) {
    await cloudinary.v2.uploader.destroy(product.brand_logo_id);
    const result = await cloudinary.v2.uploader.upload(req.body.logo, { folder: 'brands' });
    updates.brand_logo_id = result.public_id;
    updates.brand_logo_url = result.secure_url;
    updates.brand_name = req.body.brandname;
  }

  if (req.body.specifications) {
    updates.specifications = req.body.specifications.map((s) => (typeof s === 'string' ? JSON.parse(s) : s));
  }

  const fields = ['name', 'description', 'highlights', 'price', 'cuttedPrice', 'category', 'stock', 'warranty'];
  fields.forEach((f) => { if (req.body[f] !== undefined) updates[f === 'cuttedPrice' ? 'cutted_price' : f] = req.body[f]; });

  const { data: updated, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select().single();
  if (error) return next(new ErrorHandler(error.message, 400));
  res.status(200).json({ success: true, product: updated });
});

// ── ADMIN: delete product ────────────────────────────────────────
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const { data: product } = await supabase.from('products').select('images,brand_logo_id').eq('id', req.params.id).single();
  if (!product) return next(new ErrorHandler('Product not found', 404));

  for (const img of product.images) await cloudinary.v2.uploader.destroy(img.public_id);
  if (product.brand_logo_id) await cloudinary.v2.uploader.destroy(product.brand_logo_id);

  await supabase.from('products').delete().eq('id', req.params.id);
  res.status(200).json({ success: true });
});

// ── Create / update review ───────────────────────────────────────
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const { data: product } = await supabase.from('products').select('id').eq('id', productId).single();
  if (!product) return next(new ErrorHandler('Product not found', 404));

  // upsert review (unique constraint on product_id + user_id)
  await supabase.from('reviews').upsert([{
    product_id: productId,
    user_id: req.user.id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  }], { onConflict: 'product_id,user_id' });

  // recalculate ratings
  const { data: reviews } = await supabase.from('reviews').select('rating').eq('product_id', productId);
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await supabase.from('products').update({ ratings: avg, num_of_reviews: reviews.length }).eq('id', productId);

  res.status(200).json({ success: true });
});

// ── Get product reviews ──────────────────────────────────────────
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {
  const { data: reviews, error } = await supabase.from('reviews').select('*').eq('product_id', req.query.id);
  if (error) return next(new ErrorHandler('Product not found', 404));
  res.status(200).json({ success: true, reviews });
});

// ── Delete review ────────────────────────────────────────────────
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {
  await supabase.from('reviews').delete().eq('id', req.query.id).eq('product_id', req.query.productId);

  // recalculate ratings
  const { data: reviews } = await supabase.from('reviews').select('rating').eq('product_id', req.query.productId);
  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  await supabase.from('products').update({ ratings: avg, num_of_reviews: reviews.length }).eq('id', req.query.productId);

  res.status(200).json({ success: true });
});
