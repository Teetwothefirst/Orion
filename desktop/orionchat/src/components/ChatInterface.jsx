import React, { useState } from 'react';
import { Search, MoreHorizontal, Send, Home, MessageCircle, Users, Heart, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
const ChatInterface = () => {
  const [selectedContact, setSelectedContact] = useState('Monalisa');
  const [messageInput, setMessageInput] = useState('');

  const contacts = [
    { name: 'Monalisa', lastMessage: 'He came later due to som...', time: '11:23PM', avatar: '👩🏻‍💼', unread: false, online: true },
    { name: 'Ronald Richards', lastMessage: 'Sunt ea culpa do', time: '11:23PM', avatar: '👨🏽‍💼', unread: false, online: false },
    { name: 'Jenny Wilson', lastMessage: 'Excepteur sint occaecat c...', time: '11:23PM', avatar: '👩🏼‍💼', unread: false, online: true },
    { name: 'Jane Cooper', lastMessage: 'No, he is not', time: '11:23PM', avatar: '👩🏻', unread: false, online: true },
    { name: 'Kristin Watson', lastMessage: 'Duis aute irure dolor in re...', time: '11:23PM', avatar: '👩🏼', unread: false, online: false },
    { name: 'Darlene Robert', lastMessage: 'Please do this items', time: '11:23PM', avatar: '👩🏿‍💼', unread: false, online: false },
    { name: 'Leslie Alexander', lastMessage: 'Excepteur sint occaecat c...', time: '11:23PM', avatar: '👩🏼‍🦰', unread: false, online: true },
    { name: 'Ralph Edwards', lastMessage: 'Nope, we can\'t', time: '11:23PM', avatar: '👨🏾', unread: false, online: false },
    { name: 'Jacob Jones', lastMessage: 'Neque porro quisquam est...', time: '11:23PM', avatar: '👨🏻', unread: false, online: false },
    { name: 'Arlene McCoy', lastMessage: 'Sed ut perspiciatis unde...', time: '11:23PM', avatar: '👩🏾', unread: false, online: false },
    { name: 'Floyd Miles', lastMessage: 'Ut enim ad minim veniam...', time: '11:23PM', avatar: '👨🏿', unread: false, online: false },
    { name: 'Dianne Russell', lastMessage: 'I will come ASAP', time: '11:23PM', avatar: '👩🏻‍🦱', unread: false, online: true },
    { name: 'Devon Lane', lastMessage: 'Ut enim ad minim veniam...', time: '11:23PM', avatar: '👨🏼', unread: false, online: true },
    { name: 'Robert Fox', lastMessage: '', time: '11:23PM', avatar: '👨🏻‍💼', unread: false, online: false }
  ];

  const messages = [
    { sender: 'Monalisa', message: 'Hello Jenny Cooper, how things there?', time: '', isOwn: false },
    { sender: 'You', message: 'Hei Doe, I\'m doing well, what\'s about you? What\'s are you doing?', time: '', isOwn: true },
    { sender: 'Monalisa', message: 'Yeah, I doing great', time: '', isOwn: false },
    { sender: 'Monalisa', message: 'Do you know about javascript and typescript also?I need a some help on my project. Can you assist me.', time: '', isOwn: false },
    { sender: 'You', message: 'yes, I know. Ok, let me know, when you need', time: '16:32PM', isOwn: true },
    { sender: 'Monalisa', message: 'Hello! Good Morning! What\'s going on?', time: 'Aug 23 2023', isOwn: false },
    { sender: 'You', message: 'Good Morning John Doe!', time: '', isOwn: true },
    { sender: 'You', message: 'Hei Doe, I\'m doing well, what\'s about you? What\'s are you doing?', time: '', isOwn: true },
    { sender: 'Monalisa', message: 'We want to start our project. Can we start now?I need a some help on my project. Can you assist me.', time: '', isOwn: false },
    { sender: 'You', message: 'Sure! We can start', time: '', isOwn: true },
    { sender: 'Monalisa', message: 'Ok, let get started', time: '', isOwn: false },
    { sender: 'Monalisa', message: 'Do you have zoom app?', time: '', isOwn: false }
  ];

  const photos = [
    '🏞️', '🌅', '🎨', '🌊', '🏔️', '🎭', '🏜️', '❄️'
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* Header */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logoSection}>
            <div style={styles.logo}>
              <span style={styles.logoText}>O</span>
            </div>
            <span style={styles.logoipsum}>Orion Chat</span>
          </div>
          <div style={styles.userSection}>
            <div style={styles.userAvatar}>
              <span>👤</span>
            </div>
            <span style={styles.userName}>Jenny Cooper</span>
          </div>
        </div>

        {/* Navigation */}
        {/* <div style={styles.navigation}>
          <div style={styles.navItemActive}>
            <Home size={20} style={styles.navIcon} />
          </div>
          <div style={styles.navItem}>
            <MessageCircle size={20} style={styles.navIcon} />
          </div>
          <div style={styles.navItem}>
            <Users size={20} style={styles.navIcon} />
          </div>
          <div style={styles.navItem}>
            <Heart size={20} style={styles.navIcon} />
          </div>
          <div style={styles.navItem}>
            <Bell size={20} style={styles.navIcon} />
          </div>
        </div> */}

        {/* Connections Header */}
        <div style={styles.connectionsHeader}>
          <span style={styles.connectionsTitle}>Connections</span>
          <Search size={16} style={styles.searchIcon} />
        </div>

        {/* Contacts List */}
        <div style={styles.contactsList}>
          {contacts.map((contact, index) => (
            <div
              key={index}
              style={{
                ...styles.contactItem,
                ...(selectedContact === contact.name ? styles.contactItemSelected : {})
              }}
              onClick={() => setSelectedContact(contact.name)}
            >
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>
                  {contact.avatar}
                </div>
                {contact.online && (
                  <div style={styles.onlineIndicator}></div>
                )}
              </div>
              <div style={styles.contactInfo}>
                <div style={styles.contactHeader}>
                  <p style={styles.contactName}>{contact.name}</p>
                  <span style={styles.contactTime}>{contact.time}</span>
                </div>
                <p style={styles.contactMessage}>{contact.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        {/* <div >
          <div><p>So sad to see you go</p></div>
          <button>Logout</button>
          <Link>Logout</Link>
        </div> */}
        <div>
            <div style={styles.logout}><p>So sad to see you go</p>
            <Link to={`/`} className='btn btn-login'>Next</Link>
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainChat}>
        {/* Chat Messages */}
        <div style={styles.chatArea}>
          {/* Chat Header */}
          <div style={styles.chatHeader}>
            <div style={styles.chatHeaderLeft}>
              <div style={styles.chatAvatar}>
                👩🏻‍💼
              </div>
              <div>
                <h3 style={styles.chatName}>Monalisa</h3>
                <p style={styles.chatStatus}>Last seen 10 min ago</p>
              </div>
            </div>
            <div style={styles.chatHeaderRight}>
              <Search size={20} style={styles.chatIcon} />
              <MoreHorizontal size={20} style={styles.chatIcon} />
            </div>
          </div>

          {/* Messages */}
          <div style={styles.messagesContainer}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent: message.isOwn ? 'flex-end' : 'flex-start'
                }}
              >
                {!message.isOwn && (
                  <div style={styles.messageAvatar}>
                    👩🏻‍💼
                  </div>
                )}
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(message.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther)
                  }}
                >
                  <p style={styles.messageText}>{message.message}</p>
                  {message.time && (
                    <p style={{
                      ...styles.messageTime,
                      color: message.isOwn ? 'rgba(255,255,255,0.7)' : '#9CA3AF'
                    }}>
                      {message.time}
                    </p>
                  )}
                </div>
                {message.isOwn && (
                  <div style={styles.messageAvatarOwn}>
                    👤
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div style={styles.messageInput}>
            <div style={styles.inputContainer}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message"
                style={styles.input}
              />
              <button style={styles.sendButton}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={styles.rightSidebar}>
        <div style={styles.profileSection}>
          <div style={styles.profileAvatar}>
            👩🏻‍💼
          </div>
          <h3 style={styles.profileName}>Monalisa</h3>
          <p style={styles.profileRole}>Head Of Design at Logoipsum</p>
          <p style={styles.profileLocation}>Bangladesh</p>
          <p style={styles.profileTime}>Local Time: 5:41PM (UTC +06:00)</p>
        </div>

        <div style={styles.photosSection}>
          <div style={styles.photoTabs}>
            <button style={styles.photoTabActive}>
              Photos
            </button>
            <button style={styles.photoTab}>
              Files
            </button>
          </div>

          <div style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <div
                key={index}
                style={styles.photoItem}
              >
                {photo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: 'linear-gradient(135deg, #fce7f3 0%, #e0e7ff 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  sidebar: {
    width: '320px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb'
  },
  logout: {
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',

  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logo: {
    width: '32px',
    height: '32px',
    backgroundColor: '#000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  logoipsum: {
    fontWeight: '600',
    color: '#1f2937'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#fb923c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500'
  },
  navigation: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    gap: '4px'
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    cursor: 'pointer'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  navIcon: {
    color: '#6b7280'
  },
  connectionsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6'
  },
  connectionsTitle: {
    fontWeight: '500',
    color: '#1f2937'
  },
  searchIcon: {
    color: '#9ca3af'
  },
  contactsList: {
    overflowY: 'auto',
    flex: 1
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  contactItemSelected: {
    backgroundColor: '#dbeafe'
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '-4px',
    right: '-4px',
    width: '12px',
    height: '12px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    border: '2px solid white'
  },
  contactInfo: {
    marginLeft: '12px',
    flex: 1,
    minWidth: 0
  },
  contactHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  contactName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  contactTime: {
    fontSize: '12px',
    color: '#6b7280'
  },
  contactMessage: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  mainChat: {
    flex: 1,
    display: 'flex'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #e5e7eb'
  },
  chatHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  chatAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  chatName: {
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  chatStatus: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  chatHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  chatIcon: {
    color: '#9ca3af',
    cursor: 'pointer'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px'
  },
  messageAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0
  },
  messageAvatarOwn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#fb923c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0
  },
  messageBubble: {
    maxWidth: '448px',
    padding: '12px 16px',
    borderRadius: '16px'
  },
  messageBubbleOwn: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  messageBubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    color: '#1f2937'
  },
  messageText: {
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.4'
  },
  messageTime: {
    fontSize: '12px',
    margin: '4px 0 0 0'
  },
  messageInput: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid #e5e7eb'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  input: {
    flex: 1,
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '24px',
    border: 'none',
    outline: 'none',
    fontSize: '14px'
  },
  sendButton: {
    width: '40px',
    height: '40px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  rightSidebar: {
    width: '320px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderLeft: '1px solid #e5e7eb',
    padding: '24px'
  },
  profileSection: {
    textAlign: 'center'
  },
  profileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 16px'
  },
  profileName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '18px',
    margin: '0 0 4px 0'
  },
  profileRole: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0'
  },
  profileLocation: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0'
  },
  profileTime: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0
  },
  photosSection: {
    marginTop: '32px'
  },
  photoTabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    gap: '16px'
  },
  photoTabActive: {
    paddingBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    borderBottom: '2px solid #3b82f6',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  photoTab: {
    paddingBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '16px'
  },
  photoItem: {
    aspectRatio: '1',
    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  }
};

// Add hover effects
const originalNavItem = styles.navItem;
styles.navItem = {
  ...originalNavItem,
  ':hover': {
    backgroundColor: '#f9fafb'
  }
};

const originalContactItem = styles.contactItem;
styles.contactItem = {
  ...originalContactItem,
  ':hover': {
    backgroundColor: '#f9fafb'
  }
};

const originalSendButton = styles.sendButton;
styles.sendButton = {
  ...originalSendButton,
  ':hover': {
    backgroundColor: '#2563eb'
  }
};

const originalPhotoItem = styles.photoItem;
styles.photoItem = {
  ...originalPhotoItem,
  ':hover': {
    transform: 'scale(1.05)'
  }
};

export default ChatInterface;