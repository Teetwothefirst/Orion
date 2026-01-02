import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, Send, Home, MessageCircle, Users, Heart, Bell, Plus, X, Paperclip, Check, CheckCheck, Reply, Forward, FileText, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { api, socket } from './services/api.js';
import BugReportModal from './components/BugReportModal.jsx';

const ChatInterface = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: { status, lastSeen } }
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', bio: '', avatar: null });
  const fileInputRef = useRef(null);
  const profileImageRef = useRef(null);



  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchContacts();

    socket.on('receive_message', (message) => {
      if (selectedContact && message.chat_id === selectedContact.id) {
        setMessages((prev) => [...prev, {
          id: message.id,
          sender: message.username,
          message: message.content,
          type: message.type,
          media_url: message.media_url,
          status: message.status,
          reply_to_id: message.reply_to_id,
          reply_content: message.reply_content,
          reply_sender_id: message.reply_sender_id,
          forwarded_from_id: message.forwarded_from_id,
          time: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: message.sender_id === user.id,
          avatar: message.avatar
        }]);

        // If message is for active chat and not from self, mark it as read immediately
        if (message.sender_id !== user.id) {
          socket.emit('message_read', { chatId: selectedContact.id, userId: user.id });
        }

        scrollToBottom();
      }
      fetchContacts();
    });

    socket.on('status_update', (data) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
    });

    socket.on('chat_read', (data) => {
      if (selectedContact && data.chatId === selectedContact.id) {
        setMessages(prev => prev.map(m => m.isOwn ? { ...m, status: 'read' } : m));
      }
    });

    // Mark current chat as read when focused
    if (selectedContact) {
      socket.emit('message_read', { chatId: selectedContact.id, userId: user.id });
    }

    socket.on('user_status', (data) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: { status: data.status, lastSeen: data.lastSeen }
      }));
    });

    if (user) {
      socket.emit('user_online', user.id);
      setProfileForm({ username: user.username, bio: user.bio || '', avatar: user.avatar });
    }

    return () => {
      socket.off('receive_message');
      socket.off('status_update');
      socket.off('chat_read');
      socket.off('user_status');
    };
  }, [user, selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      socket.emit('join_room', selectedContact.id);
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    try {
      const response = await api.get(`/chats?userId=${user.id}`);
      const formattedContacts = response.data.map(chat => ({
        id: chat.id,
        name: chat.name || chat.group_name, // Backend might return group_name separately
        type: chat.type || 'private',
        lastMessage: chat.last_message || 'No messages yet',
        lastMessageType: chat.last_message_type,
        time: chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        avatar: chat.avatar || (chat.type === 'private' ? '👤' : '👥'),
        bio: chat.bio,
        lastSeen: chat.last_seen,
        unread: false,
        online: false // Will be updated by onlineUsers state
      }));
      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      const formattedMessages = response.data.map(msg => ({
        id: msg.id,
        sender: msg.username,
        message: msg.content,
        type: msg.type,
        media_url: msg.media_url,
        status: msg.status,
        reply_to_id: msg.reply_to_id,
        reply_content: msg.reply_content,
        reply_sender_id: msg.reply_sender_id,
        forwarded_from_id: msg.forwarded_from_id,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.sender_id === user.id,
        avatar: msg.avatar
      }));
      setMessages(formattedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = (overrideData = {}) => {
    if ((!messageInput.trim() && !overrideData.media_url) || !selectedContact) return;

    const messageData = {
      chatId: selectedContact.id,
      senderId: user.id,
      content: messageInput,
      type: 'text',
      ...overrideData
    };

    if (replyTo) {
      messageData.reply_to_id = replyTo.id;
      setReplyTo(null);
    }

    socket.emit('send_message', messageData);
    setMessageInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await api.post('/chats/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleSendMessage({
        content: `Sent a \${response.data.type}`,
        type: response.data.type,
        media_url: response.data.url
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmForward = (chatId) => {
    if (!forwardingMessage) return;

    const messageData = {
      chatId: chatId,
      senderId: user.id,
      content: forwardingMessage.message,
      type: forwardingMessage.type,
      media_url: forwardingMessage.media_url,
      forwarded_from_id: forwardingMessage.id
    };

    socket.emit('send_message', messageData);
    setShowForwardModal(false);
    setForwardingMessage(null);

    // Switch to the chat if not already there?
    const contact = contacts.find(c => c.id === chatId);
    if (contact) {
      setSelectedContact(contact);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('username', profileForm.username);
    formData.append('bio', profileForm.bio);
    if (profileForm.avatarFile) {
      formData.append('avatar', profileForm.avatarFile);
    }

    try {
      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update local user state if necessary, but AuthContext usually handles it
      // For now, we manually update the local form and close modal
      setShowProfileModal(false);
      alert('Profile updated successfully!');
      window.location.reload(); // Simple way to refresh user data from AuthContext/Storage
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data || 'Failed to update profile');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get(`/users?currentUserId=${user.id}`);
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStartChat = async (otherUser) => {
    try {
      const response = await api.post('/chats', {
        userId: user.id,
        otherUserId: otherUser.id
      });

      setShowNewChatModal(false);
      setUserSearchQuery('');
      await fetchContacts();

      const chatResponse = await api.get(`/chats?userId=${user.id}`);
      const chat = chatResponse.data.find(c => c.id === response.data.id);
      if (chat) {
        setSelectedContact({
          id: chat.id,
          name: chat.name,
          lastMessage: chat.last_message || 'No messages yet',
          time: chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          avatar: '👤',
          unread: false,
          online: true
        });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleOpenNewChatModal = () => {
    setShowNewChatModal(true);
    fetchAvailableUsers();
  };

  const filteredUsers = availableUsers.filter(u =>
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );



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
          <div
            style={{ ...styles.userSection, cursor: 'pointer' }}
            onClick={() => setShowProfileModal(true)}
            title="Profile Settings"
          >
            <div style={styles.userAvatar}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span>👤</span>
              )}
            </div>
            <span style={styles.userName}>{user?.username || 'User'}</span>
          </div>
        </div>

        {/* Connections Header */}
        <div style={styles.connectionsHeader}>
          <span style={styles.connectionsTitle}>Connections</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Plus
              size={20}
              style={{ ...styles.searchIcon, cursor: 'pointer' }}
              onClick={handleOpenNewChatModal}
              title="New Chat"
            />
            <Search size={16} style={styles.searchIcon} />
          </div>
        </div>

        {/* Toggle (Chat / Group) */}
        <div style={styles.toggleContainer}>
          <div style={styles.toggleWrapper}>
            <div
              style={{
                ...styles.toggleButton,
                ...(activeTab === 'chat' ? styles.toggleButtonActive : {})
              }}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </div>
            <div
              style={{
                ...styles.toggleButton,
                ...(activeTab === 'group' ? styles.toggleButtonActive : {})
              }}
              onClick={() => setActiveTab('group')}
            >
              Group
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div style={styles.contactsList}>
          {contacts
            .filter(c => activeTab === 'chat' ? c.type === 'private' : c.type !== 'private')
            .map((contact, index) => (
              <div
                key={index}
                style={{
                  ...styles.contactItem,
                  ...(selectedContact?.id === contact.id ? styles.contactItemSelected : {})
                }}
                onClick={() => setSelectedContact(contact)}
              >
                <div style={styles.avatarContainer}>
                  <div style={styles.avatar}>
                    {contact.avatar && contact.avatar.startsWith('http') ? (
                      <img src={contact.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      contact.avatar
                    )}
                  </div>
                  {(onlineUsers[contact.id]?.status === 'online' || contact.online) && (
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

      </div>

      {/* Support Link */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6' }}>
        <span
          style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setShowBugReport(true)}
        >
          Report a Bug
        </span>
      </div>

      {/* Logout Button */}
      <div>
        <div style={styles.logout}>
          <button onClick={handleLogout} className='btn btn-login' style={{
            background: 'red',
            padding: '8px 16px',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px',
            marginBottom: '10px'
          }}>Logout</button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainChat}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <div style={styles.chatAvatar}>
                  {selectedContact.avatar && selectedContact.avatar.startsWith('http') ? (
                    <img src={selectedContact.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    '👤'
                  )}
                </div>
                <div>
                  <h3 style={styles.chatName}>{selectedContact.name}</h3>
                  <p style={styles.chatStatus}>
                    {onlineUsers[selectedContact.id]?.status === 'online' ? (
                      <span style={{ color: '#10b981' }}>Online</span>
                    ) : onlineUsers[selectedContact.id]?.lastSeen || selectedContact.lastSeen ? (
                      `Last seen \${new Date(onlineUsers[selectedContact.id]?.lastSeen || selectedContact.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    ) : (
                      'Last seen recently'
                    )}
                  </p>
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
                      👤
                    </div>
                  )}
                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(message.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther)
                    }}
                  >
                    {message.reply_to_id && (
                      <div style={styles.replyContext}>
                        <p style={styles.replySender}>
                          {message.reply_sender_id === user.id ? 'You' : message.sender}
                        </p>
                        <p style={styles.replySnippet}>{message.reply_content}</p>
                      </div>
                    )}

                    {message.type === 'image' && (
                      <img src={message.media_url} alt="Shared" style={styles.mediaImage} />
                    )}

                    {message.type === 'video' && (
                      <video src={message.media_url} controls style={styles.mediaVideo} />
                    )}

                    {message.type === 'document' && (
                      <a href={message.media_url} target="_blank" rel="noopener noreferrer" style={styles.mediaDoc}>
                        <FileText size={24} />
                        <span>{message.message || 'Document'}</span>
                      </a>
                    )}

                    {message.type === 'text' && (
                      <p style={styles.messageText}>{message.message}</p>
                    )}

                    <div style={styles.messageMeta}>
                      {message.time && (
                        <p style={{
                          ...styles.messageTime,
                          color: message.isOwn ? 'rgba(255,255,255,0.7)' : '#9CA3AF'
                        }}>
                          {message.time}
                        </p>
                      )}
                      {message.isOwn && (
                        <div style={styles.statusIcon}>
                          {message.status === 'sent' && <Check size={14} color="rgba(255,255,255,0.7)" />}
                          {message.status === 'delivered' && <CheckCheck size={14} color="rgba(255,255,255,0.7)" />}
                          {message.status === 'read' && <CheckCheck size={14} color="#60a5fa" />}
                        </div>
                      )}
                    </div>

                    {/* Message Hover Actions */}
                    <div style={styles.messageActions}>
                      <Reply size={16} style={styles.actionIcon} onClick={() => setReplyTo(message)} />
                      <Forward size={16} style={styles.actionIcon} onClick={() => {
                        setForwardingMessage(message);
                        setShowForwardModal(true);
                      }} />
                    </div>
                  </div>
                  {
                    message.isOwn && (
                      <div style={styles.messageAvatarOwn}>
                        👤
                      </div>
                    )
                  }
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={styles.messageInput}>
              {replyTo && (
                <div style={styles.replyPreview}>
                  <div style={styles.replyPreviewContent}>
                    <p style={styles.replyPreviewSender}>Replying to {replyTo.sender}</p>
                    <p style={styles.replyPreviewText}>{replyTo.message}</p>
                  </div>
                  <X size={18} style={{ cursor: 'pointer' }} onClick={() => setReplyTo(null)} />
                </div>
              )}
              <div style={styles.inputContainer}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  style={styles.attachButton}
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <div style={styles.spinner}></div> : <Paperclip size={20} />}
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message"
                  style={styles.input}
                />
                <button style={styles.sendButton} onClick={() => handleSendMessage()}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#6b7280' }}>
            <MessageCircle size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>Select a chat to start messaging</h3>
          </div>
        )}
      </div>

      {/* Right Sidebar - Optional, hidden for now or static */}
      {/* <div style={styles.rightSidebar}> ... </div> */}
      {/* New Chat Modal */}
      {
        showNewChatModal && (
          <div style={styles.modalOverlay} onClick={() => setShowNewChatModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {activeTab === 'group' ? 'New Group Chat' : 'Start New Chat'}
                </h2>
                <X
                  size={24}
                  style={{ cursor: 'pointer', color: '#6b7280' }}
                  onClick={() => setShowNewChatModal(false)}
                />
              </div>

              {/* Group Creation UI */}
              {activeTab === 'group' && (
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Group Name"
                    style={{ ...styles.searchInput, flex: 1 }}
                    id="groupNameInput"
                  />
                  <button
                    style={{ ...styles.sendButton, borderRadius: '8px', width: 'auto', padding: '0 16px' }}
                    onClick={() => {
                      const name = document.getElementById('groupNameInput').value;
                      const selectedCheckboxes = document.querySelectorAll('input[name="userSelect"]:checked');
                      const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

                      if (!name) return alert('Please enter a group name');
                      if (selectedIds.length === 0) return alert('Please select at least one member');

                      // Call API to create group
                      // For now, reusing handleStartChat logic but adapted
                      api.post('/chats', {
                        userId: user.id,
                        type: 'group',
                        name: name,
                        participantIds: selectedIds
                      }).then(async (response) => {
                        setShowNewChatModal(false);
                        await fetchContacts();
                        // Select the new chat
                        // Logic similar to handleStartChat
                        const chatResponse = await api.get(`/chats?userId=${user.id}`);
                        const chat = chatResponse.data.find(c => c.id === response.data.id);
                        if (chat) {
                          setSelectedContact({
                            id: chat.id,
                            name: chat.name || chat.group_name,
                            type: chat.type,
                            lastMessage: chat.last_message || 'No messages yet',
                            time: '',
                            avatar: '👥',
                            unread: false,
                            online: true
                          });
                        }
                      }).catch(err => console.error(err));
                    }}
                  >
                    Create
                  </button>
                </div>
              )}

              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={styles.searchInput}
                autoFocus
              />

              <div style={styles.userList}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      style={styles.userItem}
                      onClick={() => {
                        if (activeTab === 'chat') {
                          handleStartChat(u);
                        } else {
                          // Toggle checkbox if clicking row in group mode
                          const cb = document.getElementById(`user-cb-${u.id}`);
                          if (cb) cb.click();
                        }
                      }}
                    >
                      {activeTab === 'group' && (
                        <input
                          type="checkbox"
                          name="userSelect"
                          value={u.id}
                          id={`user-cb-${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginRight: '12px' }}
                        />
                      )}
                      <div style={styles.userItemAvatar}>👤</div>
                      <div style={styles.userItemInfo}>
                        <p style={styles.userItemName}>{u.username}</p>
                        <p style={styles.userItemEmail}>{u.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Bug Report Modal */}
      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Profile</h2>
              <X size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowProfileModal(false)} />
            </div>
            <form onSubmit={handleUpdateProfile} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{ ...styles.userAvatar, width: '80px', height: '80px', fontSize: '32px', cursor: 'pointer', marginBottom: '10px' }}
                  onClick={() => profileImageRef.current.click()}
                >
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : '👤'}
                </div>
                <input
                  type="file"
                  ref={profileImageRef}
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProfileForm({ ...profileForm, avatar: URL.createObjectURL(file), avatarFile: file });
                    }
                  }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Click to change avatar</span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#374151' }}>Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#374151' }}>Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', height: '80px', resize: 'none' }}
                />
              </div>
              <button
                type="submit"
                style={{ width: '100%', padding: '10px', backgroundColor: '#000', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forward Selection Modal */}
      {showForwardModal && (
        <div style={styles.modalOverlay} onClick={() => setShowForwardModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Forward Message</h2>
              <X
                size={24}
                style={{ cursor: 'pointer', color: '#6b7280' }}
                onClick={() => setShowForwardModal(false)}
              />
            </div>

            <div style={{ padding: '0 16px 16px 16px', color: '#6b7280', fontSize: '14px' }}>
              Select a contact to forward this message to.
            </div>

            <div style={styles.userList}>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  style={styles.userItem}
                  onClick={() => confirmForward(contact.id)}
                >
                  <div style={styles.userItemAvatar}>{contact.avatar || '👤'}</div>
                  <div style={styles.userItemInfo}>
                    <p style={styles.userItemName}>{contact.name}</p>
                    <p style={styles.userItemEmail}>{contact.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
  toggleContainer: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
  },
  toggleWrapper: {
    display: 'flex',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px',
  },
  toggleButton: {
    flex: 1,
    textAlign: 'center',
    padding: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    color: '#1f2937',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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
    display: 'flex',
    flexDirection: 'column' // Ensure column layout
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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexShrink: 0
  },
  replyContext: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeft: '4px solid #3b82f6',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '8px',
    fontSize: '12px'
  },
  replySender: {
    fontWeight: 'bold',
    margin: 0,
    color: '#3b82f6'
  },
  replySnippet: {
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    opacity: 0.8
  },
  mediaImage: {
    maxWidth: '100%',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer'
  },
  mediaVideo: {
    maxWidth: '100%',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  mediaDoc: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit',
    marginBottom: '8px'
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    marginTop: '4px'
  },
  statusIcon: {
    display: 'flex',
    alignItems: 'center'
  },
  messageActions: {
    position: 'absolute',
    right: '-30px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'none',
    gap: '8px'
  },
  actionIcon: {
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    ':hover': { opacity: 1 }
  },
  replyPreview: {
    padding: '8px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeft: '4px solid #3b82f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  replyPreviewContent: {
    overflow: 'hidden'
  },
  replyPreviewSender: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: 0,
    color: '#3b82f6'
  },
  replyPreviewText: {
    fontSize: '12px',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    opacity: 0.8
  },
  attachButton: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f4f6',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.025em'
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid transparent',
    backgroundColor: '#f3f4f6',
    borderRadius: '16px',
    fontSize: '15px',
    outline: 'none',
    marginBottom: '20px',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    flexShrink: 0,
    ':focus': {
      backgroundColor: 'white',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)'
    }
  },
  userList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '4px',
    minHeight: 0
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0',
      transform: 'translateY(-1px)'
    }
  },
  userItemAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    marginRight: '16px',
    flexShrink: 0
  },
  userItemInfo: {
    flex: 1,
    minWidth: 0
  },
  userItemName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 2px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userItemEmail: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
    color: '#9ca3af',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  profileContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px'
  },
  profileAvatarLarge: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#fb923c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    marginBottom: '16px'
  },
  profileName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  profileEmail: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0 0 24px 0'
  },
  profileActions: {
    display: 'flex',
    gap: '12px',
    width: '100%'
  },
  profileButton: {
    flex: 1,
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    color: 'white',
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