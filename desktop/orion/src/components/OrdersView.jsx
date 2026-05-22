import React, { useState, useEffect } from 'react';
import { Package, Clock, Truck, CheckCircle, Search, RefreshCw, ChevronRight, User, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';

export const OrdersView = ({ viewMode = 'buyer', sidebarCollapsed, setSidebarCollapsed }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [viewMode]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const role = viewMode === 'seller' ? 'vendor' : 'buyer';
      const res = await api.get(`/marketplace/orders?role=${role}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/marketplace/orders/${orderId}/status`, { status: newStatus });
      alert(`Order marked as ${newStatus}`);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Error updating order status');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = 
      order.id.toString().includes(searchQuery) ||
      (order.payment_ref && order.payment_ref.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.vendor_name && order.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.buyer_name && order.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusDetails = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending Payment', color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={12} /> };
      case 'paid':
        return { label: 'Paid (Escrowed)', color: '#3b82f6', bg: '#dbeafe', icon: <Package size={12} /> };
      case 'shipped':
        return { label: 'Shipped', color: '#6366f1', bg: '#e0e7ff', icon: <Truck size={12} /> };
      case 'delivered':
        return { label: 'Delivered', color: '#10b981', bg: '#d1fae5', icon: <CheckCircle size={12} /> };
      default:
        return { label: status, color: '#6b7280', bg: '#f3f4f6', icon: <Package size={12} /> };
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Column 2: Sidebar (Orders Status Filter) */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} data-no-drag>
        <div className="sidebar-header">
          <span className="sidebar-title">Order Status</span>
          <button className="sidebar-action-btn" onClick={() => fetchOrders()}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="sidebar-content" style={{ padding: '12px' }}>
          {['all', 'pending', 'paid', 'shipped', 'delivered'].map((status) => (
            <div
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedStatus === status ? '600' : '400',
                backgroundColor: selectedStatus === status ? 'var(--color-primary-light)' : 'transparent',
                color: selectedStatus === status ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                marginBottom: '4px',
                transition: 'all var(--duration-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textTransform: 'capitalize'
              }}
            >
              <span>{status}</span>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>
                {status === 'all' 
                  ? orders.length 
                  : orders.filter(o => o.status === status).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Main content panel */}
      <div className="main-content" style={{ padding: '24px', overflowY: 'auto' }} data-no-drag>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              {viewMode === 'seller' ? 'Incoming Seller Orders' : 'My Purchase Orders'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {viewMode === 'seller' ? 'Manage orders placed for your listings' : 'Track your purchases and release escrow funds.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 8px', width: '220px', boxShadow: 'var(--shadow-xs)' }}>
              <Search size={16} style={{ color: 'var(--color-text-tertiary)', marginRight: '6px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px', padding: '6px 0', color: 'var(--color-text)' }}
              />
            </div>
            <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div className="spin" style={{ width: '24px', height: '24px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '40px' }}>
            <ShoppingBag size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>No Orders Found</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
              No orders matched your selected status filter or search parameters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((order) => {
              const status = getStatusDetails(order.status);
              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)' }}>
                          Order #{order.id}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: status.color, backgroundColor: status.bg, padding: '2px 8px', borderRadius: '12px' }}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text)', display: 'block' }}>
                        ₦{Number(order.total_amount).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        Ref: {order.payment_ref ? order.payment_ref.substring(0, 12) + '...' : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '12px 0', borderTop: '1px solid var(--color-border-light)', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                        <User size={14} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'block' }}>
                          {viewMode === 'seller' ? 'Buyer' : 'Vendor'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                          {viewMode === 'seller' ? order.buyer_name : order.vendor_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                    {viewMode === 'buyer' && order.status === 'paid' && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Waiting for seller to ship.
                      </span>
                    )}

                    {viewMode === 'buyer' && order.status === 'shipped' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px var(--color-primary-glow)'
                        }}
                      >
                        Confirm Delivery & Release Funds
                      </button>
                    )}

                    {viewMode === 'seller' && order.status === 'paid' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px var(--color-primary-glow)'
                        }}
                      >
                        Ship Order
                      </button>
                    )}

                    {viewMode === 'seller' && order.status === 'shipped' && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        In transit. Waiting for buyer confirmation.
                      </span>
                    )}

                    {order.status === 'delivered' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
                        <CheckCircle size={14} />
                        Order Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
