const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getToken() {
  try { return JSON.parse(localStorage.getItem('admin_auth') || '{}').token || ''; }
  catch { return ''; }
}
async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res  = await fetch(BASE + path, { ...opts, headers: { ...headers, ...(opts.headers||{}) } });
  if (res.status === 401) { localStorage.removeItem('admin_auth'); window.location.href = '/'; }
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
// Auth
export const adminLoginAPI = b => api('/auth/login', { method:'POST', body:JSON.stringify(b) });
// Products
export const getProductsAPI  = ()       => api('/product/all');
export const createProductAPI= fd       => fetch(BASE+'/product/create',  { method:'POST', headers:{'Authorization':'Bearer '+getToken()}, body:fd }).then(r=>r.json());
export const updateProductAPI= (id,fd)  => fetch(BASE+'/product/update/'+id, { method:'PUT',  headers:{'Authorization':'Bearer '+getToken()}, body:fd }).then(r=>r.json());
export const deleteProductAPI= id       => api('/product/delete/'+id, { method:'DELETE' });
export const getPhotoURL     = id       => BASE+'/product/photo/'+id;
// Categories
export const getCategoriesAPI   = ()      => api('/category/all');
export const createCategoryAPI  = b       => api('/category/create', { method:'POST', body:JSON.stringify(b) });
export const updateCategoryAPI  = (id,b)  => api('/category/update/'+id, { method:'PUT', body:JSON.stringify(b) });
export const deleteCategoryAPI  = id      => api('/category/delete/'+id, { method:'DELETE' });

// Orders
export const adminGetOrdersAPI  = (p=1,s='') => api('/order/admin/all?page='+p+'&limit=20'+(s?'&status='+encodeURIComponent(s):''));
//export const getSingleOrderAPI  = id         => api('/order/'+id);
export const getSingleOrderAPI = id => api('/order/admin/' + id);
export const adminUpdateStatusAPI = (id,b)   => api('/order/admin/'+id+'/status', { method:'PATCH', body:JSON.stringify(b) });

// Reviews
export const adminGetReviewsAPI   = (p=1,a='') => api('/review/admin/all?page='+p+'&limit=12'+(a!==''?'&approved='+a:''));
export const adminApproveReviewAPI= (id,b)     => api('/review/admin/'+id+'/approve', { method:'PATCH', body:JSON.stringify(b) });
export const deleteReviewAPI      = id         => api('/review/'+id, { method:'DELETE' });

export const getDeliveryEstimateAPI = pin => api('/delivery?pincode='+pin);

export default api;