const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5001/api';

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function api(endpoint, options) {
  options = options || {};
  var token = null;
  try {
    var stored = localStorage.getItem('auth');
    if (stored) token = JSON.parse(stored).token;
  } catch(_) {}

  var isFormData = options.body instanceof FormData;
  var headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (options.headers) Object.assign(headers, options.headers);

  var res = await fetch(BASE_URL + endpoint, Object.assign({}, options, { headers }));

  // Auto redirect on 401
  if (res.status === 401) {
    localStorage.removeItem('auth');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  var data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function registerAPI(body)        { return api('/auth/register',       { method:'POST', body: JSON.stringify(body) }); }
export function loginAPI(body)           { return api('/auth/login',          { method:'POST', body: JSON.stringify(body) }); }
export function forgotPasswordAPI(body)  { return api('/auth/forgot-password',{ method:'POST', body: JSON.stringify(body) }); }
export function resetPasswordAPI(t, b)  { return api('/auth/reset-password/'+t, { method:'POST', body: JSON.stringify(b) }); }

// ── Products — matches backend: GET /api/product/all, /:slug, /photo/:id ─────
export function getProductsAPI()        { return api('/product/all'); }
export function getSingleProductAPI(s)  { return api('/product/'+s); }
export function getProductPhotoAPI(id)  { return BASE_URL + '/product/photo/' + id; }
export function getCategoriesAPI()      { return api('/category/all'); }

// ── Cart ──────────────────────────────────────────────────────────────────────
export function getCartAPI()            { return api('/cart'); }
export function addToCartAPI(b)         { return api('/cart/add',        { method:'POST',   body: JSON.stringify(b) }); }
export function updateCartAPI(b)        { return api('/cart/update',     { method:'PUT',    body: JSON.stringify(b) }); }
export function removeCartItemAPI(id)   { return api('/cart/remove/'+id, { method:'DELETE' }); }
export function clearCartAPI()          { return api('/cart/clear',      { method:'DELETE' }); }

// ── Orders ────────────────────────────────────────────────────────────────────
export function placeOrderAPI(b)        { return api('/order/place',     { method:'POST', body: JSON.stringify(b) }); }
export function getMyOrdersAPI(p)       { return api('/order/my-orders?page='+(p||1)+'&limit=10'); }
export function getSingleOrderAPI(id)   { return api('/order/'+id); }
export function cancelOrderAPI(id,b)    { return api('/order/'+id+'/cancel', { method:'POST', body: JSON.stringify(b) }); }
export function returnOrderAPI(id,b)    { return api('/order/'+id+'/return',  { method:'POST', body: JSON.stringify(b) }); }
export function markNotifReadAPI(id)    { return api('/order/'+id+'/notifications/read', { method:'PATCH' }); }

// ── Delivery ──────────────────────────────────────────────────────────────────
export function getDeliveryEstimateAPI(pin) { return api('/delivery?pincode='+pin); }

// ── Reviews ───────────────────────────────────────────────────────────────────
export function getReviewsAPI(pid, params)  { return api('/review/'+pid+(params||'')); }
export function createReviewAPI(pid, b)     { return api('/review/'+pid,    { method:'POST',   body: JSON.stringify(b) }); }
export function updateReviewAPI(rid, b)     { return api('/review/'+rid,    { method:'PUT',    body: JSON.stringify(b) }); }
export function deleteReviewAPI(rid)        { return api('/review/'+rid,    { method:'DELETE' }); }
export function helpfulVoteAPI(rid)         { return api('/review/'+rid+'/helpful', { method:'POST' }); }

// ── Admin ─────────────────────────────────────────────────────────────────────
export function adminGetOrdersAPI(p, s)     { return api('/order/admin/all?page='+(p||1)+'&limit=20'+(s?'&status='+s:'')); }
export function adminUpdateStatusAPI(id,b)  { return api('/order/admin/'+id+'/status', { method:'PATCH', body: JSON.stringify(b) }); }
export function createProductAPI(fd)        { return api('/product/create', { method:'POST', body: fd }); }
export function updateProductAPI(id,fd)     { return api('/product/update/'+id, { method:'PUT', body: fd }); }
export function deleteProductAPI(id)        { return api('/product/delete/'+id, { method:'DELETE' }); }
export function createCategoryAPI(b)        { return api('/category/create', { method:'POST', body: JSON.stringify(b) }); }
export function updateCategoryAPI(id,b)     { return api('/category/update/'+id, { method:'PUT', body: JSON.stringify(b) }); }
export function deleteCategoryAPI(id)       { return api('/category/delete/'+id, { method:'DELETE' }); }
export function adminGetReviewsAPI(p)       { return api('/review/admin/all?page='+(p||1)); }
export function adminApproveReviewAPI(id,b) { return api('/review/admin/'+id+'/approve', { method:'PATCH', body: JSON.stringify(b) }); }
// ── Razorpay Payment ──────────────────────────────────────────────────────────
export function createRazorpayOrderAPI(b)  { return api('/payment/create-order', { method:'POST', body: JSON.stringify(b) }); }
export function verifyPaymentAPI(b)        { return api('/payment/verify',        { method:'POST', body: JSON.stringify(b) }); }