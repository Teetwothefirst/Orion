import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, MoreVertical, Send, Home, MessageCircle, Users, Heart, Bell, Plus, X, Paperclip, Check, CheckCheck, Reply, Forward, FileText, Play, Sticker, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { api, socket } from './services/api.js';
import BugReportModal from './components/BugReportModal.jsx';
import { encryptionService } from './utils/EncryptionService';

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
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaTab, setMediaTab] = useState('gif'); // 'gif' or 'sticker'
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [stickerPacks, setStickerPacks] = useState([]);
  const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ messages: [], chats: [], users: [] });
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [myRole, setMyRole] = useState('member');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [isChannel, setIsChannel] = useState(false);
  const fileInputRef = useRef(null);
  const profileImageRef = useRef(null);

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);



  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchContacts();

    socket.on('receive_message', async (message) => {
      let displayContent = message.content;
      if (message.type === 'encrypted') {
        try {
          const encryptedData = JSON.parse(message.content);
          displayContent = await encryptionService.decryptMessage(message.sender_id, encryptedData);
        } catch (err) {
          console.error('Decryption failed:', err);
          displayContent = '[Decryption Failed]';
        }
      }

      if (selectedContact && message.chat_id === selectedContact.id) {
        setMessages((prev) => [...prev, {
          id: message.id,
          sender: message.username,
          message: displayContent,
          type: message.type === 'encrypted' ? 'text' : message.type,
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

      // Native Desktop Notification
      if (message.sender_id !== user.id && !document.hasFocus()) {
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification(message.username, {
            body: message.type === 'encrypted' || message.type === 'text' ? displayContent : `Sent a ${message.type}`,
            icon: message.avatar || '👤'
          });

          notification.onclick = () => {
            window.focus();
            const contact = contacts.find(c => c.id === message.chat_id);
            if (contact) {
              setSelectedContact(contact);
            } else {
              fetchContacts().then(updatedContacts => {
                const newContact = updatedContacts?.find(c => c.id === message.chat_id);
                if (newContact) setSelectedContact(newContact);
              });
            }
          };
        }
      }

      fetchContacts();
    });

    socket.on('status_update', (data) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
    });

    socket.on('reaction_update', (data) => {
      console.log('Received reaction_update:', data);
      setMessages(prev => prev.map(m => {
        if (m.id === data.messageId) {
          const currentReactions = m.reactions || [];
          let newReactions;

          if (data.action === 'added') {
            // Check if emoji group exists
            const existingGroup = currentReactions.find(r => r.emoji === data.emoji);
            if (existingGroup) {
              newReactions = currentReactions.map(r => r.emoji === data.emoji ? {
                ...r,
                count: r.count + 1,
                user_ids: [...r.user_ids, data.userId]
              } : r);
            } else {
              newReactions = [...currentReactions, { emoji: data.emoji, count: 1, user_ids: [data.userId] }];
            }
          } else {
            // Removed
            newReactions = currentReactions.map(r => r.emoji === data.emoji ? {
              ...r,
              count: r.count - 1,
              user_ids: r.user_ids.filter(id => id !== data.userId)
            } : r).filter(r => r.count > 0);
          }
          console.log('Updated reactions for message:', { messageId: m.id, newReactions });
          return { ...m, reactions: newReactions };
        }
        return m;
      }));
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
      fetchStickers();
      encryptionService.initialize(user.id).catch(err => console.error('Signal Init Error:', err));
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

  useEffect(() => {
    if (showMediaPicker && mediaTab === 'gif') {
      fetchGifs();
    }
  }, [showMediaPicker, mediaTab, gifSearch]);

  const fetchStickers = async () => {
    try {
      const response = await api.get('/chats/stickers');
      setStickerPacks(response.data.packs || []);
    } catch (error) {
      console.error('Error fetching stickers:', error);
    }
  };

  const fetchGifs = async () => {
    try {
      const endpoint = gifSearch.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch)}&limit=20`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;

      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    }
  };

  const handleSendGif = (gifUrl) => {
    handleSendMessage({
      type: 'gif',
      content: 'Sent a GIF',
      media_url: gifUrl
    });
    setShowMediaPicker(false);
    setGifSearch('');
  };

  const handleSendSticker = (stickerUrl) => {
    handleSendMessage({
      type: 'sticker',
      content: 'Sent a Sticker',
      media_url: stickerUrl
    });
    setShowMediaPicker(false);
  };

  const onEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
  };

  const handleGlobalSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults({ messages: [], chats: [], users: [] });
      return;
    }

    try {
      const response = await api.get(`/chats/search?q=${encodeURIComponent(query)}&userId=${user.id}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const fetchParticipants = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}/participants`);
      setParticipants(response.data);
      const me = response.data.find(p => p.id === user.id);
      if (me) setMyRole(me.role);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleRemoveParticipant = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) return;
    try {
      await api.delete(`/chats/${selectedContact.id}/participants/${targetUserId}?adminId=${user.id}`);
      fetchParticipants(selectedContact.id);
    } catch (error) {
      alert(error.response?.data || 'Error removing participant');
    }
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    try {
      await api.post(`/chats/${selectedContact.id}/role`, {
        adminId: user.id,
        targetUserId,
        role: newRole
      });
      fetchParticipants(selectedContact.id);
    } catch (error) {
      alert(error.response?.data || 'Error updating role');
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode) return;
    try {
      const response = await api.post(`/chats/join/${inviteCode}`, { userId: user.id });
      alert(response.data.message);
      setShowJoinModal(false);
      setInviteCode('');
      fetchContacts();
    } catch (error) {
      alert(error.response?.data || 'Error joining group');
    }
  };

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
        avatar: msg.avatar,
        reactions: msg.reactions || []
      }));
      setMessages(await Promise.all(formattedMessages.map(async (m) => {
        if (m.type === 'encrypted') {
          try {
            const encryptedData = JSON.parse(m.message);
            const decrypted = await encryptionService.decryptMessage(m.sender_id === user.id ? selectedContact.other_user_id : m.sender_id, encryptedData);
            return { ...m, message: decrypted, type: 'text' };
          } catch (err) {
            console.error('Decryption failed for historical message:', err);
            return { ...m, message: '[Encrypted]' };
          }
        }
        return m;
      })));
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (overrideData = {}) => {
    if ((!messageInput.trim() && !overrideData.media_url) || !selectedContact) return;

    let content = messageInput;
    let type = overrideData.type || 'text';

    // E2EE for private chats
    if (selectedContact.type === 'private' && type === 'text' && !overrideData.media_url) {
      try {
        const encrypted = await encryptionService.encryptMessage(selectedContact.other_user_id, content);
        content = JSON.stringify(encrypted);
        type = 'encrypted';
      } catch (err) {
        console.error('Encryption failed:', err);
      }
    }

    const messageData = {
      chatId: selectedContact.id,
      senderId: user.id,
      content: content,
      type: type,
      ...overrideData
    };

    if (replyTo) {
      messageData.reply_to_id = replyTo.id;
      setReplyTo(null);
    }

    socket.emit('send_message', messageData);
    setMessageInput('');
  };

  const handleAddMembers = async () => {
    const selectedCheckboxes = document.querySelectorAll('input[name="addMemberSelect"]:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedIds.length === 0) return alert('Please select users to add.');

    try {
      await api.post(`/chats/${selectedContact.id}/participants`, {
        adminId: user.id,
        userIds: selectedIds
      });
      setShowAddMemberModal(false);
      fetchParticipants(selectedContact.id);
      alert('Members added successfully!');
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members.');
    }
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
        content: `Sent a ${response.data.type}`,
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

  const handleReaction = async (messageId, emoji) => {
    try {
      console.log('Sending reaction:', { messageId, emoji, userId: user.id });
      await api.post(`/chats/messages/${messageId}/react`, {
        userId: user.id,
        emoji
      });
      console.log('Reaction sent successfully');
    } catch (error) {
      console.error('Error toggling reaction:', error);
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

        {/* Connections Header with Search */}
        <div style={styles.connectionsHeader}>
          {searchQuery ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
              <Search size={16} style={{ color: '#9ca3af' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                placeholder="Search messages, users..."
                autoFocus
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '14px'
                }}
              />
              <X
                size={16}
                style={{ cursor: 'pointer', color: '#9ca3af' }}
                onClick={() => handleGlobalSearch('')}
              />
            </div>
          ) : (
            <>
              <span style={styles.connectionsTitle}>Connections</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Users
                  size={18}
                  style={{ ...styles.searchIcon, cursor: 'pointer' }}
                  onClick={() => setShowJoinModal(true)}
                  title="Join Group by Code"
                />
                <Plus
                  size={20}
                  style={{ ...styles.searchIcon, cursor: 'pointer' }}
                  onClick={handleOpenNewChatModal}
                  title="New Chat"
                />
                <Search
                  size={16}
                  style={{ ...styles.searchIcon, cursor: 'pointer' }}
                  onClick={() => handleGlobalSearch(' ')} // specific trigger to show input
                />
              </div>
            </>
          )}
        </div>

        {/* Toggle (Chat / Group) - Hide when searching */}
        {!searchQuery && (
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
        )}

        {/* Contacts List or Search Results */}
        <div style={styles.contactsList}>
          {searchQuery ? (
            <div style={{ padding: '0 16px' }}>
              {/* Users */}
              {searchResults.users.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#6b7280', margin: '12px 0 8px', textTransform: 'uppercase' }}>Users</h4>
                  {searchResults.users.map(u => (
                    <div
                      key={u.id}
                      style={styles.contactItem}
                      onClick={() => handleStartChat(u)}
                    >
                      <div style={styles.avatar}>{u.avatar || '👤'}</div>
                      <div style={styles.contactInfo}>
                        <p style={styles.contactName}>{u.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chats */}
              {searchResults.chats.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#6b7280', margin: '12px 0 8px', textTransform: 'uppercase' }}>Chats</h4>
                  {searchResults.chats.map(c => (
                    <div
                      key={c.id}
                      style={styles.contactItem}
                      onClick={() => {
                        // Find if existing contact, else fetch
                        const contact = contacts.find(existing => existing.id === c.id);
                        if (contact) {
                          setSelectedContact(contact);
                          setSearchQuery('');
                        } else {
                          // If not in contacts (unlikely for 'chats' result but possible), reload contacts
                          fetchContacts().then(() => {
                            const refreshed = contacts.find(existing => existing.id === c.id);
                            if (refreshed) setSelectedContact(refreshed);
                          });
                        }
                      }}
                    >
                      <div style={styles.avatar}>{c.avatar || (c.type === 'private' ? '👤' : '👥')}</div>
                      <div style={styles.contactInfo}>
                        <p style={styles.contactName}>{c.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              {searchResults.messages.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', color: '#6b7280', margin: '12px 0 8px', textTransform: 'uppercase' }}>Messages</h4>
                  {searchResults.messages.map(m => (
                    <div
                      key={m.id}
                      style={styles.contactItem}
                      onClick={() => {
                        // Naivigation to message logic could be complex (scroll to message), for now just open chat
                        const contact = contacts.find(c => c.id === m.chat_id);
                        if (contact) {
                          setSelectedContact(contact);
                          setSearchQuery('');
                        }
                      }}
                    >
                      <div style={{ ...styles.avatar, width: '32px', height: '32px', fontSize: '14px' }}>{m.avatar || '👤'}</div>
                      <div style={styles.contactInfo}>
                        <div style={styles.contactHeader}>
                          <p style={styles.contactName}>{m.chat_name || m.username}</p>
                          <span style={styles.contactTime}>{new Date(m.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={styles.contactMessage}>{m.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.users.length === 0 && searchResults.chats.length === 0 && searchResults.messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No results found</div>
              )}
            </div>
          ) : (
            contacts
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
              ))
          )}
        </div>

      </div>

      {/* Support and Logout removed from here for a cleaner UI */}

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
                <div
                  style={{ cursor: selectedContact.type !== 'private' ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (selectedContact.type !== 'private') {
                      fetchParticipants(selectedContact.id);
                      setShowGroupInfo(true);
                    }
                  }}
                >
                  <h3 style={styles.chatName}>{selectedContact.name}</h3>
                  <p style={styles.chatStatus}>
                    {selectedContact.type === 'private' ? (
                      onlineUsers[selectedContact.id]?.status === 'online' ? (
                        <span style={{ color: '#10b981' }}>Online</span>
                      ) : onlineUsers[selectedContact.id]?.lastSeen || selectedContact.lastSeen ? (
                        `Last seen ${new Date(onlineUsers[selectedContact.id]?.lastSeen || selectedContact.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      ) : (
                        'Last seen recently'
                      )
                    ) : (
                      'Group Info'
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
                    className="message-bubble-container"
                    style={{
                      ...styles.messageBubble,
                      ...(message.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther)
                    }}
                    onMouseEnter={(e) => {
                      const actions = e.currentTarget.querySelector('.message-actions');
                      if (actions) actions.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const actions = e.currentTarget.querySelector('.message-actions');
                      if (actions) actions.style.opacity = '0';
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

                    {message.type === 'gif' && (
                      <img src={message.media_url} alt="GIF" style={styles.mediaGif} />
                    )}

                    {message.type === 'sticker' && (
                      <img src={message.media_url} alt="Sticker" style={styles.mediaSticker} />
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

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div style={styles.reactionList}>
                        {message.reactions.map((r, idx) => (
                          <div
                            key={idx}
                            style={{
                              ...styles.reactionChip,
                              backgroundColor: r.user_ids.includes(user.id) ? '#dbeafe' : 'rgba(255,255,255,0.9)',
                              border: r.user_ids.includes(user.id) ? '1px solid #3b82f6' : '1px solid #e5e7eb'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReaction(message.id, r.emoji);
                            }}
                          >
                            <span>{r.emoji}</span>
                            <span style={{ fontSize: '10px', marginLeft: '4px', fontWeight: 'bold' }}>{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Hover Actions */}
                    <div className="message-actions" style={styles.messageActions}>
                      <div style={{ position: 'relative' }}>
                        <MoreVertical
                          size={16}
                          style={styles.actionIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMessageMenu(activeMessageMenu === message.id ? null : message.id);
                          }}
                        />
                        {/* Dropdown Menu */}
                        {activeMessageMenu === message.id && (
                          <div style={styles.messageDropdown} onClick={(e) => e.stopPropagation()}>
                            <div
                              style={styles.dropdownItem}
                              onClick={() => {
                                setActiveReactionMessageId(message.id);
                                setActiveMessageMenu(null);
                              }}
                            >
                              <Heart size={14} style={{ marginRight: '8px' }} />
                              React
                            </div>
                            <div
                              style={styles.dropdownItem}
                              onClick={() => {
                                setReplyTo(message);
                                setActiveMessageMenu(null);
                              }}
                            >
                              <Reply size={14} style={{ marginRight: '8px' }} />
                              Reply
                            </div>
                            <div
                              style={styles.dropdownItem}
                              onClick={() => {
                                setForwardingMessage(message);
                                setShowForwardModal(true);
                                setActiveMessageMenu(null);
                              }}
                            >
                              <Forward size={14} style={{ marginRight: '8px' }} />
                              Forward
                            </div>
                          </div>
                        )}
                        {/* Reaction Picker Popup */}
                        {activeReactionMessageId === message.id && (
                          <div style={styles.reactionPickerPopup} onClick={(e) => e.stopPropagation()}>
                            {['❤️', '👍', '😂', '😮', '😢', '😡'].map(emoji => (
                              <span
                                key={emoji}
                                style={styles.reactionPickerItem}
                                onClick={() => {
                                  handleReaction(message.id, emoji);
                                  setActiveReactionMessageId(null);
                                }}
                              >
                                {emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
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
                <button
                  style={styles.attachButton}
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                >
                  <Smile size={20} color={showMediaPicker ? '#007AFF' : '#6b7280'} />
                </button>
                <button style={styles.sendButton} onClick={() => handleSendMessage()}>
                  <Send size={18} />
                </button>
              </div>

              {showMediaPicker && (
                <div style={styles.mediaPickerContainer}>
                  <div style={styles.mediaPickerTabs}>
                    <button
                      style={{ ...styles.mediaTab, borderBottom: mediaTab === 'emoji' ? '2px solid #007AFF' : 'none', color: mediaTab === 'emoji' ? '#007AFF' : '#6b7280' }}
                      onClick={() => setMediaTab('emoji')}
                    >
                      Emoji
                    </button>
                    <button
                      style={{ ...styles.mediaTab, borderBottom: mediaTab === 'gif' ? '2px solid #007AFF' : 'none', color: mediaTab === 'gif' ? '#007AFF' : '#6b7280' }}
                      onClick={() => setMediaTab('gif')}
                    >
                      GIFs
                    </button>
                    <button
                      style={{ ...styles.mediaTab, borderBottom: mediaTab === 'sticker' ? '2px solid #007AFF' : 'none', color: mediaTab === 'sticker' ? '#007AFF' : '#6b7280' }}
                      onClick={() => setMediaTab('sticker')}
                    >
                      Stickers
                    </button>
                    <X size={18} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setShowMediaPicker(false)} />
                  </div>


                  {mediaTab === 'emoji' ? (
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width="100%"
                        height="100%"
                        searchDisabled={false}
                        skinTonesDisabled
                      />
                    </div>
                  ) : mediaTab === 'gif' ? (
                    <>
                      <div style={styles.mediaPickerHeader}>
                        <input
                          type="text"
                          placeholder="Search GIFs..."
                          value={gifSearch}
                          onChange={(e) => setGifSearch(e.target.value)}
                          style={styles.gifSearchInput}
                          autoFocus
                        />
                      </div>
                      <div style={styles.gifGrid}>
                        {gifs.map(gif => (
                          <img
                            key={gif.id}
                            src={gif.images.fixed_height_small.url}
                            alt="GIF"
                            style={styles.gifThumb}
                            onClick={() => handleSendGif(gif.images.original.url)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={styles.stickerGrid}>
                      {stickerPacks.map(pack => (
                        <div key={pack.id}>
                          <p style={styles.stickerPackName}>{pack.name}</p>
                          <div style={styles.stickerList}>
                            {pack.stickers.map(sticker => (
                              <img
                                key={sticker.id}
                                src={sticker.url}
                                alt={sticker.name}
                                style={styles.stickerThumb}
                                onClick={() => handleSendSticker(sticker.url)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Group/Channel Name"
                      style={{ ...styles.searchInput, marginBottom: 0 }}
                      id="groupNameInput"
                    />
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                      <input
                        type="checkbox"
                        checked={isChannel}
                        onChange={(e) => setIsChannel(e.target.checked)}
                      />
                      Create as Read-only Channel
                    </label>
                  </div>
                  <button
                    style={{ ...styles.sendButton, borderRadius: '8px', width: 'auto', padding: '0 16px', height: '46px' }}
                    onClick={() => {
                      const name = document.getElementById('groupNameInput').value;
                      const selectedCheckboxes = document.querySelectorAll('input[name="userSelect"]:checked');
                      const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

                      if (!name) return alert('Please enter a name');

                      api.post('/chats', {
                        userId: user.id,
                        type: isChannel ? 'channel' : 'group',
                        name: name,
                        participantIds: selectedIds
                      }).then(async (response) => {
                        setShowNewChatModal(false);
                        setIsChannel(false);
                        await fetchContacts();

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
      {
        showProfileModal && (
          <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Edit Profile</h2>
                <X size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowProfileModal(false)} />
              </div>
              <form onSubmit={handleUpdateProfile} style={{ padding: '16px', overflow: 'auto' }}>
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

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowBugReport(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'transparent',
                      color: '#4b5563',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Bell size={16} /> Report a Bug
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#fee2e2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    Logout
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Forward Selection Modal */}
      {
        showForwardModal && (
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
        )
      }

      {/* Group Info Modal */}
      {
        showGroupInfo && (
          <div style={styles.modalOverlay} onClick={() => setShowGroupInfo(false)}>
            <div style={{ ...styles.modalContent, width: '400px' }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Group Info</h2>
                <X size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowGroupInfo(false)} />
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ ...styles.chatAvatar, width: '80px', height: '80px', fontSize: '32px', marginBottom: '16px' }}>
                  {selectedContact.avatar || '👥'}
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{selectedContact.name}</h3>
                {selectedContact.invite_code && (
                  <div style={{ backgroundColor: '#f3f4f6', padding: '8px 12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                    <code style={{ fontSize: '12px' }}>{selectedContact.invite_code}</code>
                    <button
                      style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedContact.invite_code);
                        alert('Invite code copied!');
                      }}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', color: '#6b7280', margin: 0, textTransform: 'uppercase' }}>
                    Participants ({participants.length})
                  </h4>
                  {(myRole === 'owner' || myRole === 'admin') && (
                    <button
                      style={{ fontSize: '12px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        setShowGroupInfo(false);
                        setShowAddMemberModal(true);
                      }}
                    >
                      <Plus size={14} /> Add Member
                    </button>
                  )}
                </div>
                <div style={{ ...styles.userList, maxHeight: '300px' }}>
                  {participants.map(p => (
                    <div key={p.id} style={{ ...styles.userItem, cursor: 'default' }}>
                      <div style={styles.userItemAvatar}>{p.avatar || '👤'}</div>
                      <div style={styles.userItemInfo}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={styles.userItemName}>{p.username} {p.id === user.id && '(You)'}</p>
                          <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.role}
                          </span>
                        </div>
                        {(myRole === 'owner' || myRole === 'admin') && p.id !== user.id && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            {myRole === 'owner' && (
                              <button
                                style={{ fontSize: '11px', border: 'none', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => handleUpdateRole(p.id, p.role === 'admin' ? 'member' : 'admin')}
                              >
                                {p.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                            )}
                            <button
                              style={{ fontSize: '11px', border: 'none', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => handleRemoveParticipant(p.id)}
                              disabled={p.role === 'owner' || (myRole === 'admin' && p.role === 'admin')}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Join Group Modal */}
      {
        showJoinModal && (
          <div style={styles.modalOverlay} onClick={() => setShowJoinModal(false)}>
            <div style={{ ...styles.modalContent, width: '400px' }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Join Group</h2>
                <X size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowJoinModal(false)} />
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Enter the group invite code to join a community.
                </p>
                <input
                  type="text"
                  placeholder="Invite Code (e.g. 5f2a...)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  style={styles.searchInput}
                  autoFocus
                />
                <button
                  style={{ ...styles.sendButton, width: '100%', borderRadius: '12px', padding: '12px' }}
                  onClick={handleJoinGroup}
                >
                  Join Community
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Add Member Modal */}
      {
        showAddMemberModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAddMemberModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add Members</h2>
                <X size={24} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowAddMemberModal(false)} />
              </div>

              <input
                type="text"
                placeholder="Search users to add..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={styles.searchInput}
                autoFocus
              />

              <div style={styles.userList}>
                {filteredUsers.filter(u => !participants.some(p => p.id === u.id)).map((u) => (
                  <div
                    key={u.id}
                    style={styles.userItem}
                    onClick={() => {
                      const cb = document.getElementById(`add-member-cb-${u.id}`);
                      if (cb) cb.click();
                    }}
                  >
                    <input
                      type="checkbox"
                      name="addMemberSelect"
                      value={u.id}
                      id={`add-member-cb-${u.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginRight: '12px' }}
                    />
                    <div style={styles.userItemAvatar}>👤</div>
                    <div style={styles.userItemInfo}>
                      <p style={styles.userItemName}>{u.username}</p>
                      <p style={styles.userItemEmail}>{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
                <button
                  style={{ ...styles.sendButton, width: '100%', borderRadius: '12px' }}
                  onClick={handleAddMembers}
                >
                  Add Selected Users
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
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
  reactionList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '6px',
    marginBottom: '2px'
  },
  reactionChip: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    userSelect: 'none'
  },
  reactionPickerPopup: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '6px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    zIndex: 20,
    whiteSpace: 'nowrap'
  },
  reactionPickerItem: {
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
    ':hover': { transform: 'scale(1.2)' }
  },
  messageDropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '4px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '140px',
    zIndex: 20,
    overflow: 'hidden'
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1f2937',
    transition: 'background-color 0.15s',
    ':hover': {
      backgroundColor: '#f3f4f6'
    }
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
    borderRadius: '16px',
    position: 'relative'
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
    maxHeight: '300px',
    borderRadius: '12px',
    marginTop: '4px'
  },
  mediaGif: {
    maxWidth: '100%',
    maxHeight: '250px',
    borderRadius: '12px',
    marginTop: '4px',
    display: 'block'
  },
  mediaVideo: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '12px',
    marginTop: '4px'
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
    right: '8px',
    top: '8px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: '4px',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIcon: {
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'color 0.2s'
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
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'none',
    fontSize: '14px',
    padding: '8px'
  },
  gifSearchInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none'
  },
  mediaPickerContainer: {
    position: 'absolute',
    bottom: '70px',
    right: '20px',
    width: '320px',
    height: '400px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
    border: '1px solid #e5e7eb'
  },
  mediaPickerTabs: {
    display: 'flex',
    padding: '8px 16px',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
    gap: '16px'
  },
  mediaTab: {
    background: 'none',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    color: '#6b7280'
  },
  mediaPickerHeader: {
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stickerGrid: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  },
  stickerPackName: {
    fontSize: '11px',
    color: '#9ba3af',
    marginBottom: '8px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  stickerList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  stickerThumb: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'contain',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'transform 0.2s',
  },
  mediaSticker: {
    width: '120px',
    height: '120px',
    marginTop: '8px',
    display: 'block'
  },
  gifGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    padding: '12px',
    overflowY: 'auto'
  },
  gifThumb: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s'
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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '24px',
    width: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
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