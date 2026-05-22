import React from 'react';
import { ShoppingCart, MapPin, Tag } from 'lucide-react';

const ProductCard = ({ product, onBuy }) => {
  if (!product) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      width: '100%',
      maxWidth: '300px',
      margin: '8px 0'
    }}>
      <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
        <img 
          src={product.image_url || 'https://via.placeholder.com/300x200?text=Product'} 
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 8px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Tag size={12} />
          ₦{product.price}
        </div>
      </div>
      
      <div style={{ padding: '12px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>
          {product.name}
        </h4>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>
          <MapPin size={14} />
          <span>{product.location}</span>
        </div>

        <p style={{ fontSize: '12px', color: '#4b5563', margin: '0 0 12px 0', lineHeight: '1.4' }}>
          {product.description || 'No description available.'}
        </p>

        <button
          onClick={onBuy}
          style={{
            width: '100%',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          <ShoppingCart size={16} />
          Order Now
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
