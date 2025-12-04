"""
Script to add user discovery features to ChatInterface.jsx
This script will properly insert the new code into the existing file
"""

# Read the original file
with open(r'd:\All Together\IT\Work with Itunu\OrionChat_2_Dec_25\Orion\desktop\orion\src\ChatInterface.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports - add Plus and X icons
content = content.replace(
    "import { Search, MoreHorizontal, Send, Home, MessageCircle, Users, Heart, Bell } from 'lucide-react';",
    "import { Search, MoreHorizontal, Send, Home, MessageCircle, Users, Heart, Bell, Plus, X } from 'lucide-react';"
)

# 2. Add new state variables after existing useState declarations
state_addition = """  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
"""

content = content.replace(
    "  const messagesEndRef = useRef(null);",
    "  const messagesEndRef = useRef(null);\n" + state_addition
)

# 3. Add new functions after handleLogout
new_functions = """

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
"""

content = content.replace(
    "  const handleLogout = () => {\n    logout();\n    navigate('/');\n  };",
    "  const handleLogout = () => {\n    logout();\n    navigate('/');\n  };" + new_functions
)

# 4. Update Connections Header to include Plus icon
old_connections_header = """        {/* Connections Header */}
        <div style={styles.connectionsHeader}>
          <span style={styles.connectionsTitle}>Connections</span>
          <Search size={16} style={styles.searchIcon} />
        </div>"""

new_connections_header = """        {/* Connections Header */}
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
        </div>"""

content = content.replace(old_connections_header, new_connections_header)

# 5. Make user section clickable
old_user_section = """          <div style={styles.userSection}>
            <div style={styles.userAvatar}>
              <span>👤</span>
            </div>
            <span style={styles.userName}>{user?.username || 'User'}</span>
          </div>"""

new_user_section = """          <div 
            style={{ ...styles.userSection, cursor: 'pointer' }} 
            onClick={() => setShowProfileSettings(true)}
            title="Profile Settings"
          >
            <div style={styles.userAvatar}>
              <span>👤</span>
            </div>
            <span style={styles.userName}>{user?.username || 'User'}</span>
          </div>"""

content = content.replace(old_user_section, new_user_section)

# 6. Add modals before closing container div
modals = """
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewChatModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Start New Chat</h2>
              <X 
                size={24} 
                style={{ cursor: 'pointer', color: '#6b7280' }} 
                onClick={() => setShowNewChatModal(false)}
              />
            </div>
            
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
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    style={styles.userItem}
                    onClick={() => handleStartChat(user)}
                  >
                    <div style={styles.userItemAvatar}>👤</div>
                    <div style={styles.userItemInfo}>
                      <p style={styles.userItemName}>{user.username}</p>
                      <p style={styles.userItemEmail}>{user.email}</p>
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
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileSettings(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Profile Settings</h2>
              <X 
                size={24} 
                style={{ cursor: 'pointer', color: '#6b7280' }} 
                onClick={() => setShowProfileSettings(false)}
              />
            </div>
            
            <div style={styles.profileContent}>
              <div style={styles.profileAvatarLarge}>👤</div>
              <h3 style={styles.profileName}>{user?.username}</h3>
              <p style={styles.profileEmail}>{user?.email}</p>
              
              <div style={styles.profileActions}>
                <button style={styles.profileButton}>Edit Profile</button>
                <button style={{...styles.profileButton, background: '#ef4444'}} onClick={() => {
                  setShowProfileSettings(false);
                  handleLogout();
                }}>Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace(
    "      {/* Right Sidebar - Optional, hidden for now or static */}\n      {/* <div style={styles.rightSidebar}> ... </div> */}\n    </div>",
    "      {/* Right Sidebar - Optional, hidden for now or static */}\n      {/* <div style={styles.rightSidebar}> ... </div> */}" + modals + "\n    </div>"
)

# 7. Add new styles
new_styles = """,
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  userList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    backgroundColor: '#f9fafb'
  },
  userItemAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginRight: '12px'
  },
  userItemInfo: {
    flex: 1
  },
  userItemName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  userItemEmail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af'
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
  }"""

# Find the last style property and add new styles before the closing brace
import re
# Find the last property in styles object (before the final closing brace and semicolon)
content = re.sub(
    r"(  }\r?\n)(\};\r?\n\r?\nexport default ChatInterface;)",
    r"\1" + new_styles + r"\r\n\2",
    content
)

# Write the updated file
with open(r'd:\All Together\IT\Work with Itunu\OrionChat_2_Dec_25\Orion\desktop\orion\src\ChatInterface.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("ChatInterface.jsx has been updated successfully!")
print("Added features:")
print("  - New Chat button with user discovery modal")
print("  - Clickable profile section")
print("  - Profile settings modal")
print("  - User search functionality")
