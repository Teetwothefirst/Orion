import React, { useState, useEffect } from 'react';
import { PlusCircle, ShoppingBag, Eye, EyeOff, Search, Trash2, ArrowLeft, Loader2, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ListingsView = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('list'); // 'list' or 'create'
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'bag',
    category_id: '',
    location: '',
    image_url: '',
    stock_quantity: 10
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyProducts();
    fetchCategories();
  }, []);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/marketplace/products?vendor_id=${user.id}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/marketplace/categories');
      setCategories(res.data || []);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/marketplace/products', {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity)
      });
      alert('Product listed successfully!');
      setFormData({
        name: '',
        description: '',
        price: '',
        unit: 'bag',
        category_id: categories[0]?.id || '',
        location: '',
        image_url: '',
        stock_quantity: 10
      });
      setCurrentTab('list');
      fetchMyProducts();
    } catch (err) {
      console.error('Error creating product:', err);
      alert(err.response?.data?.error || 'Failed to list product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Column 2: Sidebar (Listings Quick Navigation) */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} data-no-drag>
        <div className="sidebar-header">
          <span className="sidebar-title">Manage Listings</span>
          <button className="sidebar-action-btn" onClick={() => setCurrentTab('create')}>
            <PlusCircle size={14} />
          </button>
        </div>
        <div className="sidebar-content" style={{ padding: '12px' }}>
          <div
            onClick={() => setCurrentTab('list')}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: currentTab === 'list' ? '600' : '400',
              backgroundColor: currentTab === 'list' ? 'var(--color-primary-light)' : 'transparent',
              color: currentTab === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              marginBottom: '4px',
              transition: 'all var(--duration-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>My Active Products</span>
            <span style={{ fontSize: '11px', opacity: 0.6 }}>{products.length}</span>
          </div>

          <div
            onClick={() => setCurrentTab('create')}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: currentTab === 'create' ? '600' : '400',
              backgroundColor: currentTab === 'create' ? 'var(--color-primary-light)' : 'transparent',
              color: currentTab === 'create' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              transition: 'all var(--duration-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PlusCircle size={14} />
            <span>Add New Product</span>
          </div>
        </div>
      </div>

      {/* Column 3: Main content workspace */}
      <div className="main-content" style={{ padding: '24px', overflowY: 'auto' }} data-no-drag>
        {currentTab === 'create' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <button 
                onClick={() => setCurrentTab('list')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                Add New Product
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Product Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="e.g. White Maize Bags" 
                  required
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Price (₦)</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 25000" 
                    required
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Unit</label>
                  <select 
                    name="unit" 
                    value={formData.unit} 
                    onChange={handleInputChange}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  >
                    <option value="bag">Per Bag</option>
                    <option value="kg">Per Kg</option>
                    <option value="ton">Per Ton</option>
                    <option value="crate">Per Crate</option>
                    <option value="piece">Per Piece</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Category</label>
                  <select 
                    name="category_id" 
                    value={formData.category_id} 
                    onChange={handleInputChange}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Stock Quantity</label>
                  <input 
                    type="number" 
                    name="stock_quantity" 
                    value={formData.stock_quantity} 
                    onChange={handleInputChange} 
                    placeholder="e.g. 50" 
                    required
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Location</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Kaduna, Nigeria" 
                  required
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Image URL (Optional)</label>
                <input 
                  type="url" 
                  name="image_url" 
                  value={formData.image_url} 
                  onChange={handleInputChange} 
                  placeholder="https://images.unsplash.com/photo-..." 
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows={3}
                  placeholder="Describe your product quality, shipping info, etc." 
                  required
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px var(--color-primary-glow)'
                }}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : <PlusCircle size={16} />}
                List Product
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                  My Listings
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Manage the listings you have published to the marketplace.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', width: '200px', boxShadow: 'var(--shadow-xs)' }}>
                  <Search size={16} style={{ color: 'var(--color-text-tertiary)', marginRight: '6px' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search listings..."
                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px', padding: '6px 0', color: 'var(--color-text)' }}
                  />
                </div>
                <button
                  onClick={() => setCurrentTab('create')}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px var(--color-primary-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={14} />
                  Add Listing
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <div className="spin" style={{ width: '24px', height: '24px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '40px' }}>
                <ShoppingBag size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>No Listings Active</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
                  You haven't listed any items for sale. Click "Add Listing" above to publish your first agricultural listing.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: '16px',
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ height: '140px', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-surface-hover)' }}>
                      <img 
                        src={p.image_url || 'https://via.placeholder.com/300x200?text=Listing'} 
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {p.category_name}
                      </div>
                    </div>

                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                          {p.name}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                          <span>₦{Number(p.price).toLocaleString()} / {p.unit}</span>
                          <span>Stock: {p.stock_quantity}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', height: '34px' }}>
                          {p.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: p.is_available ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: '600' }}>
                          {p.is_available ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span>{p.is_available ? 'Active & Visible' : 'Hidden'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
