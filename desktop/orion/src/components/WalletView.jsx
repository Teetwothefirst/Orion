import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Send, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const WalletView = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState('summary'); // 'summary' | 'deposit' | 'withdraw'
  
  // Simulations
  const [amount, setAmount] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'credit', title: 'Payout Order #102', date: 'May 20, 2026', amount: 48000, desc: 'Released from escrow' },
    { id: 2, type: 'debit', title: 'Purchased Sweet Potatoes', date: 'May 18, 2026', amount: 32000, desc: 'Escrow deposit' },
    { id: 3, type: 'debit', title: 'Withdrawal to GTBank', date: 'May 14, 2026', amount: 150000, desc: 'Payout completed' },
    { id: 4, type: 'credit', title: 'Deposit via Card', date: 'May 10, 2026', amount: 200000, desc: 'Direct top-up' }
  ]);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketplace/wallet');
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    setSimulating(true);
    setTimeout(() => {
      const depAmt = parseFloat(amount);
      setBalance(prev => prev + depAmt);
      setTransactions(prev => [
        {
          id: Date.now(),
          type: 'credit',
          title: 'Deposit via Credit Card',
          date: 'Today',
          amount: depAmt,
          desc: 'Direct top-up'
        },
        ...prev
      ]);
      setAmount('');
      setActiveAction('summary');
      setSimulating(false);
      alert(`Successfully deposited ₦${depAmt.toLocaleString()}`);
    }, 1000);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    const withAmt = parseFloat(amount);
    if (withAmt > balance) {
      alert('Insufficient wallet balance');
      return;
    }
    setSimulating(true);
    setTimeout(() => {
      setBalance(prev => prev - withAmt);
      setTransactions(prev => [
        {
          id: Date.now(),
          type: 'debit',
          title: 'Withdrawal to Zenith Bank',
          date: 'Today',
          amount: withAmt,
          desc: 'Bank payout request'
        },
        ...prev
      ]);
      setAmount('');
      setActiveAction('summary');
      setSimulating(false);
      alert(`Successfully withdrew ₦${withAmt.toLocaleString()} to Zenith Bank`);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Column 2: Sidebar (Wallet Quick Actions) */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} data-no-drag>
        <div className="sidebar-header">
          <span className="sidebar-title">My Wallet</span>
          <button className="sidebar-action-btn" onClick={() => fetchWallet()}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="sidebar-content" style={{ padding: '12px' }}>
          {[
            { id: 'summary', label: 'Wallet Summary' },
            { id: 'deposit', label: 'Deposit Funds' },
            { id: 'withdraw', label: 'Withdraw Funds' }
          ].map((act) => (
            <div
              key={act.id}
              onClick={() => setActiveAction(act.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeAction === act.id ? '600' : '400',
                backgroundColor: activeAction === act.id ? 'var(--color-primary-light)' : 'transparent',
                color: activeAction === act.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                marginBottom: '4px',
                transition: 'all var(--duration-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CreditCard size={14} />
              <span>{act.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Main Wallet Details */}
      <div className="main-content" style={{ padding: '24px', overflowY: 'auto' }} data-no-drag>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              Financial Hub
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Manage agricultural transaction settlements and escrow payouts.
            </p>
          </div>
          
          <button onClick={fetchWallet} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={16} />
          </button>
        </div>

        {activeAction === 'summary' && (
          <div>
            {/* Visual Glassmorphic Credit Card */}
            <div 
              style={{
                background: 'linear-gradient(135deg, #1D9E75 0%, #14b8a6 100%)',
                color: 'white',
                borderRadius: '24px',
                padding: '28px',
                position: 'relative',
                boxShadow: '0 20px 40px -10px var(--color-primary-glow)',
                marginBottom: '32px',
                maxWidth: '460px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              {/* Decorative glows */}
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', filter: 'blur(30px)' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>
                  Orion Settlement Card
                </span>
                <span style={{ fontSize: '18px', fontWeight: '800', fontStyle: 'italic' }}>
                  ORION
                </span>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                  Available Balance
                </span>
                <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'monospace' }}>
                  ₦{loading ? '...' : Number(balance).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, display: 'block', marginBottom: '2px' }}>
                    Card Holder
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {user?.username || 'Orion Member'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '28px', height: '18px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }}></div>
                  <div style={{ width: '28px', height: '18px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}></div>
                </div>
              </div>
            </div>

            {/* Quick Actions buttons */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <button 
                onClick={() => setActiveAction('deposit')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--duration-fast)'
                }}
              >
                <Plus size={14} style={{ color: 'var(--color-primary)' }} />
                Deposit Funds
              </button>

              <button 
                onClick={() => setActiveAction('withdraw')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--duration-fast)'
                }}
              >
                <Send size={14} style={{ color: 'var(--color-primary)' }} />
                Withdraw Payout
              </button>
            </div>

            {/* Transactions List */}
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)' }}>Recent Financial History</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--color-border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: tx.type === 'credit' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: tx.type === 'credit' ? 'var(--color-online)' : 'var(--color-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {tx.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', display: 'block' }}>
                          {tx.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {tx.desc} • {tx.date}
                        </span>
                      </div>
                    </div>

                    <span style={{ fontSize: '14px', fontWeight: '700', color: tx.type === 'credit' ? 'var(--color-online)' : 'var(--color-text)' }}>
                      {tx.type === 'credit' ? '+' : '-'} ₦{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeAction === 'deposit' || activeAction === 'withdraw') && (
          <div style={{ maxWidth: '480px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>
              {activeAction === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </h3>
            
            <form onSubmit={activeAction === 'deposit' ? handleDeposit : handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  min={100}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>

              {activeAction === 'withdraw' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Bank Code</label>
                    <input type="text" placeholder="011" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Account Number</label>
                    <input type="text" placeholder="1022384910" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveAction('summary')}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  style={{
                    flex: 2,
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {simulating ? <Loader2 size={14} className="spin" /> : null}
                  {activeAction === 'deposit' ? 'Proceed with Deposit' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
