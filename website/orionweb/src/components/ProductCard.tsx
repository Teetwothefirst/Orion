import React from 'react';
import { ShoppingCart, MapPin, Tag } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  location: string;
  image_url?: string;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onBuy?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden w-full max-w-[280px] shadow-xl hover:border-gray-700 transition-all group">
      <div className="h-40 overflow-hidden relative">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=300&auto=format&fit=crop'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
          <Tag size={12} />
          ₦{product.price.toLocaleString()}
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="text-gray-100 font-bold text-base mb-1 truncate">{product.name}</h4>
        
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <MapPin size={12} />
          <span className="truncate">{product.location}</span>
        </div>

        {product.description && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        )}

        <button
          onClick={onBuy}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <ShoppingCart size={16} />
          Order Now
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
