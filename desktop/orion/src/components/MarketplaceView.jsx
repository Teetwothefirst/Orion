import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, MapPin, Tag, Search, Mic, MicOff, Filter, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MarketplaceView = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [voiceQueryActive, setVoiceQueryActive] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  
  // Checkout states
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/marketplace/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async (search = searchQuery) => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (search.trim()) params.search = search;
      
      const res = await api.get('/products', { params }); // Note backend marketplace.js lists under `/products` inside `/marketplace` base?
      // Wait, let's verify if the route in api.js has `/marketplace` prepended or is it `/marketplace/products`?
      // Looking at `ChatInterface.jsx`:
      // `api.get('/marketplace/products')`
      // Ah! The main server.js mounts the marketplace router under `/marketplace` or `/`?
      // Let's check `server.js` or `ChatInterface.jsx` code references:
      // Line 813: `const response = await api.get('/marketplace/products');`
      // So the URL prefix is indeed `/marketplace/products`!
      const resMarket = await api.get('/marketplace/products', { params });
      setProducts(resMarket.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchProducts(searchQuery);
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/marketplace/ai-search', { query: searchQuery });
      setProducts(res.data || []);
    } catch (err) {
      console.error('AI search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceSearch = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        await handleVoiceUpload(file);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setVoiceQueryActive(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone.');
    }
  };

  const stopVoiceSearch = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleVoiceUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/marketplace/voice-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.transcription) {
        setTranscriptionText(res.data.transcription);
        setSearchQuery(res.data.transcription);
        if (res.data.products) {
          setProducts(res.data.products);
        } else {
          fetchProducts(res.data.transcription);
        }
      }
    } catch (err) {
      console.error('Voice search transcription failed:', err);
    } finally {
      setLoading(false);
      setVoiceQueryActive(false);
    }
  };

  const handleBuy = async (product) => {
    setCheckoutLoading(product.id);
    try {
      const res = await api.post('/marketplace/checkout', {
        productId: product.id,
        quantity: 1
      });
      if (res.data.checkout_url) {
        // Open Paystack checkout url in external browser
        window.open(res.data.checkout_url, '_blank');
        // Notify native Electron side of order events if possible
        if (window.electronAPI && window.electronAPI.showNotification) {
          window.electronAPI.showNotification({
            title: 'Order Initiated',
            body: `You initialized order for ${product.name}`
          });
        }
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err.response?.data?.error || 'Checkout initialization failed');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Column 2: Collapsible Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} data-no-drag>
        <div className="sidebar-header">
          <span className="sidebar-title">Categories</span>
          <button className="sidebar-action-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <Filter size={14} />
          </button>
        </div>
        <div className="sidebar-content" style={{ padding: '12px' }}>
          <div 
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: selectedCategory === null ? '600' : '400',
              backgroundColor: selectedCategory === null ? 'var(--color-primary-light)' : 'transparent',
              color: selectedCategory === null ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              marginBottom: '4px',
              transition: 'all var(--duration-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>All Products</span>
            <span style={{ fontSize: '11px', opacity: 0.6 }}>{products.length}</span>
          </div>

          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedCategory === cat.id ? '600' : '400',
                backgroundColor: selectedCategory === cat.id ? 'var(--color-primary-light)' : 'transparent',
                color: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                marginBottom: '4px',
                transition: 'all var(--duration-fast)'
              }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Main Marketplace Grid */}
      <div className="main-content" style={{ padding: '24px', overflowY: 'auto' }} data-no-drag>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              Orion Marketplace
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Browse premium agricultural products and check out securely.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', width: '280px', boxShadow: 'var(--shadow-xs)' }}>
              <Search size={16} style={{ color: 'var(--color-text-tertiary)', marginRight: '6px' }} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px', padding: '6px 0', color: 'var(--color-text)' }}
              />
              <button type="button" onClick={isRecording ? stopVoiceSearch : startVoiceSearch} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </form>

            <button 
              onClick={handleAiSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--color-primary-glow)',
                transition: 'all var(--duration-fast)'
              }}
            >
              <Sparkles size={14} />
              AI Discovery
            </button>
          </div>
        </div>

        {voiceQueryActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--color-primary-light)', borderRadius: '12px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>
            <Loader2 size={16} className="spin" style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '500' }}>
              {isRecording ? 'Listening to voice query...' : 'Transcribing voice audio...'}
            </span>
          </div>
        )}

        {transcriptionText && !voiceQueryActive && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', marginBottom: '20px', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Transcribed query: </span>
            <strong style={{ color: 'var(--color-text)' }}>"{transcriptionText}"</strong>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirecton: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading marketplace products...</span>
          </div>
        ) : products.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '40px' }}>
            <Tag size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>No Products Found</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
              We couldn't find any listings matching your search or filters. Try searching for something else!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {products.map((product) => (
              <div 
                key={product.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
                className="product-hover-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-surface-hover)' }}>
                  <img 
                    src={product.image_url || 'https://via.placeholder.com/300x200?text=AgriProduct'} 
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    ₦{Number(product.price).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                      {product.category_name}
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', margin: '4px 0 6px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
                      <MapPin size={12} />
                      <span>{product.location}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>
                      {product.description || 'No description provided.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuy(product)}
                    disabled={checkoutLoading === product.id}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'background var(--duration-fast)',
                      opacity: checkoutLoading === product.id ? 0.7 : 1
                    }}
                  >
                    {checkoutLoading === product.id ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Initiating...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        Buy Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
