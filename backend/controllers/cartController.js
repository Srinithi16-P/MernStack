// ─── cartController.js ────────────────────────────────────────────────────────
const Cart    = require('../models/cartmodel');
const Product = require('../models/productmodel');

// ─── GET CART ─────────────────────────────────────────────────────────────────
/*
  GET /api/cart
  Auth: requireSignIn
*/
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name photo slug');

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({ success: true, message: 'Cart is empty.', cart: null, totalPrice: 0 });
        }

        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return res.status(200).json({ success: true, cart, totalPrice });

    } catch (error) {
        console.error('Error in getCart:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── ADD TO CART ──────────────────────────────────────────────────────────────
/*
  POST /api/cart/add
  Auth: requireSignIn
  Body: { productId, weight, quantity }

  Smart behavior:
  - Same product + same weight → increases quantity
  - New product/weight → adds new item
  - Checks stock before adding
*/
const addToCart = async (req, res) => {
    try {
        const { productId, weight, quantity = 1 } = req.body;

        if (!productId || !weight) {
            return res.status(422).json({ success: false, message: 'Product and weight are required.' });
        }

        if (quantity < 1) {
            return res.status(422).json({ success: false, message: 'Quantity must be at least 1.' });
        }

        // ── Find product and the specific variant ──────────────────────────
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const variant = product.variants.find(v => v.weight === weight);
        if (!variant) {
            return res.status(404).json({ success: false, message: `Variant "${weight}" not found for this product.` });
        }

        // ── Stock check ────────────────────────────────────────────────────
        if (variant.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Only ${variant.stock} unit(s) available.`,
            });
        }

        // ── Find or create cart ────────────────────────────────────────────
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // ── Check if same product + same weight already in cart ────────────
        const existingIndex = cart.items.findIndex(
            item => item.product.toString() === productId && item.weight === weight
        );

        if (existingIndex > -1) {
            // Increase quantity
            const newQty = cart.items[existingIndex].quantity + quantity;

            // Re-check stock for combined quantity
            if (variant.stock < newQty) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Only ${variant.stock} unit(s) in stock and you already have ${cart.items[existingIndex].quantity} in cart.`,
                });
            }

            cart.items[existingIndex].quantity = newQty;
        } else {
            // Add new item
            cart.items.push({
                product:  productId,
                weight,
                quantity,
                price:    variant.price,
            });
        }

        await cart.save();

        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return res.status(200).json({
            success: true,
            message: 'Item added to cart.',
            cart,
            totalPrice,
        });

    } catch (error) {
        console.error('Error in addToCart:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── UPDATE CART ITEM QUANTITY ────────────────────────────────────────────────
/*
  PUT /api/cart/update
  Auth: requireSignIn
  Body: { cartItemId, quantity }
  quantity = 0 → removes item
*/
const updateCartItem = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;

        if (!cartItemId || quantity === undefined) {
            return res.status(422).json({ success: false, message: 'cartItemId and quantity are required.' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        if (quantity <= 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Check stock before updating
            const product = await Product.findById(cart.items[itemIndex].product);
            const variant  = product?.variants.find(v => v.weight === cart.items[itemIndex].weight);

            if (!variant || variant.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${variant?.stock || 0} unit(s) available.`,
                });
            }

            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();

        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return res.status(200).json({ success: true, message: 'Cart updated.', cart, totalPrice });

    } catch (error) {
        console.error('Error in updateCartItem:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── REMOVE ITEM FROM CART ────────────────────────────────────────────────────
/*
  DELETE /api/cart/remove/:cartItemId
  Auth: requireSignIn
*/
const removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const before = cart.items.length;
        cart.items = cart.items.filter(item => item._id.toString() !== cartItemId);

        if (cart.items.length === before) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        await cart.save();

        const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return res.status(200).json({ success: true, message: 'Item removed from cart.', cart, totalPrice });

    } catch (error) {
        console.error('Error in removeCartItem:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── CLEAR ENTIRE CART ────────────────────────────────────────────────────────
/*
  DELETE /api/cart/clear
  Auth: requireSignIn
*/
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
        return res.status(200).json({ success: true, message: 'Cart cleared.' });
    } catch (error) {
        console.error('Error in clearCart:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };