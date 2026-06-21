import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCartAPI, addToCartAPI, updateCartAPI, removeCartItemAPI, clearCartAPI } from '../api/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

function showToast(msg, type) {
  // Simple inline toast using DOM (no dependency needed)
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;bottom:28px;right:28px;
    background:${type==='error'?'#d93025':'#2d4a1e'};
    color:white;padding:12px 22px;border-radius:30px;
    font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;
    opacity:0;transition:opacity 0.3s;pointer-events:none;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.style.opacity = '1', 10);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2500);
}

export function CartProvider({ children }) {
  const { auth } = useAuth();
  const [cart, setCart]               = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartCount, setCartCount]     = useState(0);

  const fetchCart = useCallback(async () => {
    if (!auth?.token) { setCart(null); setCartCount(0); return; }
    setCartLoading(true);
    try {
      const res = await getCartAPI();
      setCart(res.data);
      const count = res.data.cart?.items?.reduce((s,i) => s+i.quantity, 0) || 0;
      setCartCount(count);
    } catch (_) { setCart(null); setCartCount(0); }
    finally { setCartLoading(false); }
  }, [auth?.token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, weight, quantity = 1) => {
    if (!auth?.token) { showToast('Please login to add items to cart','error'); return false; }
    try {
      await addToCartAPI({ productId, weight, quantity });
      await fetchCart();
      showToast('Added to cart! 🛒', 'success');
      return true;
    } catch (_) { showToast('Could not add to cart','error'); return false; }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try { await updateCartAPI({ cartItemId, quantity }); await fetchCart(); }
    catch (_) { showToast('Update failed','error'); }
  };

  const removeCartItem = async (cartItemId) => {
    try { await removeCartItemAPI(cartItemId); await fetchCart(); showToast('Item removed','success'); }
    catch (_) { showToast('Remove failed','error'); }
  };

  const clearCart = async () => {
    try { await clearCartAPI(); await fetchCart(); } catch (_) {}
  };

  const totalPrice = cart?.cart?.items?.reduce((s,i) => s + i.price*i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart, cartLoading, cartCount, totalPrice,
      fetchCart, addToCart, updateCartItem, removeCartItem, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }