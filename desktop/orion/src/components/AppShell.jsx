import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Store, Package, PlusCircle, FileText, BarChart3, Wallet, 
  Bell, Search, Sparkles, ChevronLeft, ChevronRight, X, User, LogOut,
  Minus, Square, Power, Settings
} from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Subviews
import ChatInterface from '../ChatInterface';
import { MarketplaceView } from './MarketplaceView';
import { OrdersView } from './OrdersView';
import { ListingsView } from './ListingsView';
import { AnalyticsView } from './AnalyticsView';
import { WalletView } from './WalletView';

// Custom Tooltip component mimicking Radix
const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div 
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="tooltip-content" style={{
          position: 'absolute',
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          zIndex: 99999
        }}>
          {content}
        </div>
      )}
    </div>
  );
};

const AppShell = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { role, setRole, isBuyer, isSeller, isBoth } = useUserRole();

  // Navigation state
  const [activeNav, setActiveNav] = useState('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('orion_theme') || 'dark';
  });

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New order #302 placed for White Maize', type: 'order' },
    { id: 2, text: 'New message from Farmer Adamu', type: 'chat' }
  ]);
  const [showNotificationList, setShowNotificationList] = useState(false);

  // Command Palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdResults, setCmdResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const cmdInputRef = useRef(null);

  const platform = window.electronAPI?.platform || 'win32';

  // 1. Electron IPC controls
  const handleWindowControl = (action) => {
    if (window.electronAPI && window.electronAPI.windowControls) {
      window.electronAPI.windowControls(action);
    } else {
      console.log(`Electron Action Triggered: ${action}`);
    }
  };

  // 2. System theme listener & manual toggling
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('orion_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Media listener for system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    // Set initially from system if not saved
    if (!localStorage.getItem('orion_theme')) {
      setTheme(mediaQuery.matches ? 'dark' : 'light');
    }

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // 3. Command Palette Keyboard toggle (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus command palette input
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => {
        cmdInputRef.current?.focus();
      }, 50);
      setCmdQuery('');
      loadQuickActions();
    }
  }, [commandPaletteOpen]);

  // Combined badge count logic
  useEffect(() => {
    const combinedCount = notifications.length;
    if (window.electronAPI && window.electronAPI.setBadgeCount) {
      window.electronAPI.setBadgeCount(combinedCount);
    }
  }, [notifications]);

  // 4. Command Palette search functionality
  const loadQuickActions = () => {
    setCmdResults([
      { id: 'theme-light', section: 'Quick actions', text: 'Switch to Light Theme', action: () => setTheme('light') },
      { id: 'theme-dark', section: 'Quick actions', text: 'Switch to Dark Theme', action: () => setTheme('dark') },
      { id: 'role-buyer', section: 'Quick actions', text: 'Switch role: Buyer', action: () => setRole('buyer') },
      { id: 'role-seller', section: 'Quick actions', text: 'Switch role: Seller', action: () => setRole('seller') },
      { id: 'role-both', section: 'Quick actions', text: 'Switch role: Both', action: () => setRole('both') },
      { id: 'open-wallet', section: 'Quick actions', text: 'View Wallet balance', action: () => setActiveNav('wallet') },
      { id: 'logout', section: 'Quick actions', text: 'Sign Out / Log Out', action: () => { logout(); navigate('/'); } }
    ]);
    setHighlightedIndex(0);
  };

  useEffect(() => {
    if (!cmdQuery.trim()) {
      loadQuickActions();
      return;
    }

    const performSearch = async () => {
      let results = [];
      
      // Call AI Marketplace Search
      try {
        const res = await api.post('/marketplace/ai-search', { query: cmdQuery });
        if (res.data && res.data.length > 0) {
          res.data.slice(0, 3).forEach(p => {
            results.push({
              id: `prod-${p.id}`,
              section: 'Search products',
              text: `Buy ${p.name} at ${p.location} — ₦${p.price}`,
              action: () => {
                setActiveNav('marketplace');
                setCommandPaletteOpen(false);
              }
            });
          });
        }
      } catch (err) {
        console.error('Command AI Search failed:', err);
      }

      // Jump to Chat matching query
      results.push({
        id: 'jump-chat',
        section: 'Jump to chat',
        text: `Search chats for "${cmdQuery}"`,
        action: () => {
          setActiveNav('chat');
          setCommandPaletteOpen(false);
        }
      });

      // Search Orders
      results.push({
        id: 'orders-search',
        section: 'My orders',
        text: `Find orders containing "${cmdQuery}"`,
        action: () => {
          setActiveNav(isSeller ? 'incoming-orders' : 'my-orders');
          setCommandPaletteOpen(false);
        }
      });

      setCmdResults(results);
      setHighlightedIndex(0);
    };

    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [cmdQuery]);

  // Command palette keyboard navigation
  const handleCmdKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % cmdResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + cmdResults.length) % cmdResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (cmdResults[highlightedIndex]) {
        cmdResults[highlightedIndex].action();
        setCommandPaletteOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  // Group commands by section for display
  const groupedResults = cmdResults.reduce((acc, curr) => {
    if (!acc[curr.section]) acc[curr.section] = [];
    acc[curr.section].push(curr);
    return acc;
  }, {});

  // Compute navigation rails list based on user mode
  const getNavItems = () => {
    const list = [];
    // Chat & Wallet are shared
    list.push({ id: 'chat', label: 'Chat', icon: <MessageCircle size={18} />, badge: true });

    if (role === 'buyer') {
      list.push({ id: 'marketplace', label: 'Marketplace', icon: <Store size={18} /> });
      list.push({ id: 'my-orders', label: 'My Orders', icon: <Package size={18} />, badge: true });
    } else if (role === 'seller') {
      list.push({ id: 'my-listings', label: 'My Listings', icon: <PlusCircle size={18} /> });
      list.push({ id: 'incoming-orders', label: 'Incoming Orders', icon: <FileText size={18} />, badge: true });
      list.push({ id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> });
    } else {
      // Both mode: list all, subtle dividers are rendered manually based on group index
      list.push({ id: 'marketplace', label: 'Marketplace', icon: <Store size={18} />, group: 'buyer' });
      list.push({ id: 'my-orders', label: 'My Orders', icon: <Package size={18} />, badge: true, group: 'buyer' });
      list.push({ id: 'my-listings', label: 'My Listings', icon: <PlusCircle size={18} />, group: 'seller' });
      list.push({ id: 'incoming-orders', label: 'Incoming Orders', icon: <FileText size={18} />, badge: true, group: 'seller' });
      list.push({ id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} />, group: 'seller' });
    }

    list.push({ id: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> });
    return list;
  };

  const navItems = getNavItems();

  return (
    <div className="app-layout">
      {/* 1. Custom Titlebar Chrome */}
      <div className="titlebar">
        {/* macOS Traffic Lights on the left */}
        {platform === 'darwin' && (
          <div className="window-controls" data-no-drag>
            <button className="window-control-btn close" onClick={() => handleWindowControl('close')}></button>
            <button className="window-control-btn minimize" onClick={() => handleWindowControl('minimize')}></button>
            <button className="window-control-btn maximize" onClick={() => handleWindowControl('maximize')}></button>
          </div>
        )}

        {/* App Logo */}
        <div className="titlebar-logo" style={{ marginLeft: platform === 'darwin' ? '76px' : '4px' }}>
          <div className="titlebar-logo-icon">O</div>
          <span className="titlebar-logo-text">Orion</span>
        </div>

        {/* Role Toggle segmented pill */}
        <div className="role-toggle" data-no-drag>
          {['buyer', 'both', 'seller'].map((mode) => (
            <button
              key={mode}
              className={`role-toggle-option ${role === mode ? 'active' : ''}`}
              onClick={() => setRole(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* User avatar + notification bell + Win controls */}
        <div className="titlebar-right" data-no-drag>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button className="titlebar-btn" onClick={() => setShowNotificationList(!showNotificationList)}>
              <Bell size={16} />
              {notifications.length > 0 && <span className="badge"></span>}
            </button>

            {showNotificationList && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '36px',
                  width: '280px',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 99999,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', fontWeight: '700', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Notifications</span>
                  <button onClick={() => setNotifications([])} style={{ border: 'none', background: 'transparent', color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Clear all</button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No new alerts</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-light)', fontSize: '12px', color: 'var(--color-text)' }}>
                        {n.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Settings Dropdown */}
          <div className="titlebar-avatar" onClick={() => logout()}>
            {user?.avatar ? <img src={user.avatar} alt="Avatar" /> : <span>👤</span>}
          </div>

          {/* Windows controls on the right */}
          {platform !== 'darwin' && (
            <div className="window-controls-win">
              <button className="window-control-btn-win" onClick={() => handleWindowControl('minimize')}>
                <Minus size={14} />
              </button>
              <button className="window-control-btn-win" onClick={() => handleWindowControl('maximize')}>
                <Square size={10} />
              </button>
              <button className="window-control-btn-win close" onClick={() => handleWindowControl('close')}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Core Workspace Area */}
      <div className="app-layout-body">
        {/* Column 1: Left Icon Rail (56px) */}
        <div className="icon-rail" data-no-drag>
          {role === 'both' ? (
            // Both mode with dividers
            <>
              {/* Chat is shared and placed at top */}
              <Tooltip content="Chat">
                <button
                  className={`icon-rail-item ${activeNav === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveNav('chat')}
                >
                  <MessageCircle size={18} />
                  {notifications.filter(n => n.type === 'chat').length > 0 && <span className="badge"></span>}
                </button>
              </Tooltip>

              <div className="icon-rail-divider"></div>

              {/* Buyer Group */}
              <Tooltip content="Marketplace">
                <button
                  className={`icon-rail-item ${activeNav === 'marketplace' ? 'active' : ''}`}
                  onClick={() => setActiveNav('marketplace')}
                >
                  <Store size={18} />
                </button>
              </Tooltip>
              <Tooltip content="My Purchase Orders">
                <button
                  className={`icon-rail-item ${activeNav === 'my-orders' ? 'active' : ''}`}
                  onClick={() => setActiveNav('my-orders')}
                >
                  <Package size={18} />
                </button>
              </Tooltip>

              <div className="icon-rail-divider"></div>

              {/* Seller Group */}
              <Tooltip content="My Listings">
                <button
                  className={`icon-rail-item ${activeNav === 'my-listings' ? 'active' : ''}`}
                  onClick={() => setActiveNav('my-listings')}
                >
                  <PlusCircle size={18} />
                </button>
              </Tooltip>
              <Tooltip content="Incoming Orders">
                <button
                  className={`icon-rail-item ${activeNav === 'incoming-orders' ? 'active' : ''}`}
                  onClick={() => setActiveNav('incoming-orders')}
                >
                  <FileText size={18} />
                </button>
              </Tooltip>
              <Tooltip content="Sales Analytics">
                <button
                  className={`icon-rail-item ${activeNav === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveNav('analytics')}
                >
                  <BarChart3 size={18} />
                </button>
              </Tooltip>

              <div className="icon-rail-divider"></div>

              {/* Wallet is shared and at bottom */}
              <Tooltip content="Wallet Hub">
                <button
                  className={`icon-rail-item ${activeNav === 'wallet' ? 'active' : ''}`}
                  onClick={() => setActiveNav('wallet')}
                >
                  <Wallet size={18} />
                </button>
              </Tooltip>
            </>
          ) : (
            // Normal Single Role layouts
            navItems.map((item) => (
              <Tooltip key={item.id} content={item.label}>
                <button
                  className={`icon-rail-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  {item.icon}
                  {item.badge && notifications.length > 0 && <span className="badge"></span>}
                </button>
              </Tooltip>
            ))
          )}
        </div>

        {/* Remaining Space: Column 2 (sidebar) & Column 3 (main) */}
        {activeNav === 'chat' ? (
          // Embedded ChatInterface renders columns 2 & 3 internally
          <ChatInterface embedded={true} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
        ) : (
          // Separate sub-views mapping
          <>
            {activeNav === 'marketplace' && <MarketplaceView sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
            {activeNav === 'my-orders' && <OrdersView viewMode="buyer" sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
            {activeNav === 'incoming-orders' && <OrdersView viewMode="seller" sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
            {activeNav === 'my-listings' && <ListingsView sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
            {activeNav === 'analytics' && <AnalyticsView sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
            {activeNav === 'wallet' && <WalletView sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
          </>
        )}
      </div>

      {/* 3. Centered Global Command Palette (Cmd+K / Ctrl+K) */}
      {commandPaletteOpen && (
        <div className="cmd-palette-overlay" onClick={() => setCommandPaletteOpen(false)}>
          <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
            <div className="cmd-palette-input-wrapper">
              <Search size={18} />
              <input
                ref={cmdInputRef}
                type="text"
                className="cmd-palette-input"
                placeholder="Search products, jump to chat, or run quick actions..."
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                onKeyDown={handleCmdKeyDown}
              />
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                style={{ border: 'none', background: 'transparent', color: 'var(--color-text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <kbd style={{ fontSize: '9px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '2px 4px', borderRadius: '4px', marginRight: '6px' }}>ESC</kbd>
              </button>
            </div>

            <div className="cmd-palette-body">
              {cmdResults.length === 0 ? (
                <div className="cmd-palette-empty">No results found for "{cmdQuery}"</div>
              ) : (
                Object.keys(groupedResults).map((section) => (
                  <div key={section} className="cmd-palette-section">
                    <div className="cmd-palette-section-title">{section}</div>
                    {groupedResults[section].map((item) => {
                      const absoluteIndex = cmdResults.findIndex(r => r.id === item.id);
                      const isHighlighted = absoluteIndex === highlightedIndex;
                      return (
                        <div
                          key={item.id}
                          className={`cmd-palette-item ${isHighlighted ? 'highlighted' : ''}`}
                          onClick={() => {
                            item.action();
                            setCommandPaletteOpen(false);
                          }}
                        >
                          {item.id.startsWith('prod-') && <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />}
                          <span>{item.text}</span>
                          {isHighlighted && <span className="cmd-palette-hint">Enter</span>}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="cmd-palette-footer">
              <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select</span>
              <span>Global Search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
