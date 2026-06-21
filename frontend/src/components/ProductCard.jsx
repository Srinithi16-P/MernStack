// ProductCard.jsx
import { Link } from 'react-router-dom';
import { getProductPhotoAPI } from '../api/api';

const FALLBACK = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect fill='%23f0e8d8' width='200' height='200'/><text y='115' x='50%25' font-size='70' text-anchor='middle'>🌿</text></svg>`;

export default function ProductCard({ product }) {
  const price  = product.variants?.[0]?.price;
  const rating = product.averageRating || 0;
  const stars  = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-card-img">
        <img
          src={getProductPhotoAPI(product._id)}
          alt={product.name}
          onError={e => { e.target.src = FALLBACK; }}
        />
      </div>
      <div className="product-card-body">
        <div className="product-card-cat">{product.category?.name || 'Organic'}</div>
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-desc">
          {product.description?.slice(0,80)}{product.description?.length > 80 ? '…' : ''}
        </div>
        {rating > 0 && (
          <div className="product-card-rating">
            <span className="stars" style={{ letterSpacing:'-2px' }}>{stars}</span>
            <span> {rating.toFixed(1)} ({product.totalReviews})</span>
          </div>
        )}
        {price && <div className="product-card-price">₹{price}</div>}
        <div className="btn btn-primary btn-sm" style={{ marginTop:'auto', borderRadius:20 }}>
          View Product →
        </div>
      </div>
    </Link>
  );
}