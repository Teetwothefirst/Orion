// ============================================
// ADD THESE VARIABLES TO YOUR EXISTING JAVASCRIPT SECTION
// ============================================

// Add these to your existing variable declarations
let currentGroupId = null;
let userGroups = [];
let groupMembers = {};
let groupTypingUsers = {};

// ============================================
// ADD THESE FUNCTIONS TO YOUR EXISTING JAVASCRIPT
// ============================================

// Load user's groups
async loadUserGroups() {
    try {
        const response = await fetch('/api/groups/my');
        const data = await response.json();
        
        if (data.groups) {
            userGroups = data.groups;
            displayUserGroups();
        }
    } catch (error) {
        console.error('Error loading user groups:', error);
    }
}

// Display groups in the sidebar
displayUserGroups() {
    const groupsContainer = document.querySelector('.groupTab');
    
    if (!groupsContainer) return;
    
    groupsContainer.innerHTML = '';
    
    userGroups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'user-item group-item';
        groupElement.innerHTML = `
            <div class="user-info">
                <span class="username">${escapeHtml(group.name)}</span>
                <span class="user-status">${group.user_role}</span>
            </div>
        `;
        
        groupElement.addEventListener('click', () => openGroupChat(group));
        groupsContainer.appendChild(groupElement);
    });
}

// Open group chat
async openGroupChat(group) {
    try {
        currentGroupId = group.id;
        currentChatUser = null; // Clear private chat
        
        // Update UI
        document.getElementById('noChatSelected').style.display = 'none';
        document.getElementById('chatInterface').style.display = 'flex';
        document.getElementById('chatWithUser').textContent = `${group.name} (Group)`;
        
        // Clear existing messages
        document.getElementById('messagesContainer').innerHTML = '';
        
        // Load group details and messages
        await loadGroupDetails(group.id);
        await loadGroupMessages(group.id);
        
        // Join group room for real-time updates
        socket.emit('joinGroupRoom', { groupId: group.id });
        
        console.log('Opened group chat:', group.name);
    } catch (error) {
        console.error('Error opening group chat:', error);
    }
}

// Load group details and members
async loadGroupDetails(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}`);
        const data = await response.json();
        
        if (data.group && data.members) {
            groupMembers[groupId] = data.members;
            // You can display member list in a sidebar or modal if needed
            console.log('Group members loaded:', data.members);
        }
    } catch (error) {
        console.error('Error loading group details:', error);
    }
}

// Load group messages
async loadGroupMessages(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}/messages`);
        const data = await response.json();
        
        if (data.messages) {
            displayGroupMessages(data.messages);
        }
    } catch (error) {
        console.error('Error loading group messages:', error);
    }
}

// Display group messages
displayGroupMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender_id === currentUserId ? 'own-message' : 'other-message'}`;
        
        const time = new Date(message.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${escapeHtml(message.sender_username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(message.content)}</div>
        `;
        
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Create group  
async createGroup(groupData) {
    try {
        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(groupData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload groups list
            await loadUserGroups();
            
            // Join the new group room
            socket.emit('joinUserGroupRooms');
            
            return data.group;
        } else {
            throw new Error(data.error || 'Failed to create group');
        }
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group: ' + error.message);
        return null;
    }
}

// Send group message
sendGroupMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentGroupId) return;
    
    // Emit group message
    socket.emit('groupMessage', {
        groupId: currentGroupId,
        message: message,
        timestamp: new Date()
    });
    
    messageInput.value = '';
}

// Load and display public groups
async loadPublicGroups() {
    try {
        const response = await fetch('/api/groups/public');
        const data = await response.json();
        
        if (data.groups) {
            displayPublicGroups(data.groups);
        }
    } catch (error) {
        console.error('Error loading public groups:', error);
    }
}

// Display public groups (you can add this to a discovery section)
displayPublicGroups(groups) {
    // You can implement this to show public groups in a separate section
    console.log('Public groups:', groups);
}

// Join public group
async joinPublicGroup(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload user groups
            await loadUserGroups();
            
            // Join group rooms
            socket.emit('joinUserGroupRooms');
            
            alert('Successfully joined group!');
        } else {
            alert('Error joining group: ' + data.error);
        }
    } catch (error) {
        console.error('Error joining group:', error);
        alert('Error joining group');
    }
}

// ============================================
// MODIFY YOUR EXISTING SOCKET EVENT HANDLERS
// ============================================

// Add these to your existing socket event handlers

// Handle new group messages
this.socket.on('newGroupMessage', (messageObj) => {
    if (currentGroupId === messageObj.group_id) {
        // Display the message in current chat
        const container = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${messageObj.sender_id === currentUserId ? 'own-message' : 'other-message'}`;
        
        const time = new Date(messageObj.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${escapeHtml(messageObj.sender_username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(messageObj.content)}</div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    } else {
        // Show notification for other groups (you can implement this)
        console.log('New message in group:', messageObj.group_id);
    }
});

// Handle group typing indicators
this.socket.on('userTypingInGroup', (data) => {
    if (currentGroupId === data.groupId) {
        const typingIndicator = document.getElementById('typingIndicator');
        
        if (!groupTypingUsers[data.groupId]) {
            groupTypingUsers[data.groupId] = new Set();
        }
        
        if (data.isTyping) {
            groupTypingUsers[data.groupId].add(data.username);
        } else {
            groupTypingUsers[data.groupId].delete(data.username);
        }
        
        const typingUsers = Array.from(groupTypingUsers[data.groupId]);
        if (typingUsers.length > 0) {
            typingIndicator.textContent = `${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`;
            typingIndicator.style.display = 'block';
        } else {
            typingIndicator.style.display = 'none';
        }
    }
});

// Handle user joining group room
this.socket.on('userJoinedGroupRoom', (data) => {
    console.log(`${data.username} joined group ${data.groupId}`);
    // You can show a notification or update online status
});

// Handle user leaving group room
this.socket.on('userLeftGroupRoom', (data) => {
    console.log(`${data.username} left group ${data.groupId}`);
});

// ============================================
// MODIFY YOUR EXISTING EVENT LISTENERS
// ============================================

// Update your existing message input event listener to handle both private and group messages
// Replace your existing sendBtn click handler with this:
document.getElementById('sendBtn').addEventListener('click', () => {
    if (currentGroupId) {
        sendGroupMessage();
    } else if (currentChatUser) {
        sendMessage(); // Your existing private message function
    }
});

// Update your existing message input keypress handler
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (currentGroupId) {
            sendGroupMessage();
        } else if (currentChatUser) {
            sendMessage(); // Your existing private message function
        }
    }
});

// Add typing indicator for groups
let groupTypingTimeout;
document.getElementById('messageInput').addEventListener('input', (e) => {
    if (currentGroupId) {
        // Emit typing start
        socket.emit('typingInGroup', {
            groupId: currentGroupId,
            isTyping: true
        });
        
        // Clear existing timeout
        clearTimeout(groupTypingTimeout);
        
        // Set timeout to stop typing indicator
        groupTypingTimeout = setTimeout(() => {
            socket.emit('typingInGroup', {
                groupId: currentGroupId,
                isTyping: false
            });
        }, 1000);
    }
});

// ============================================
// UPDATE YOUR EXISTING CONNECTION HANDLER
// ============================================

// Add this to your existing socket connect handler
socket.on('connect', () => {
    console.log('Connected to server');
    // Your existing connection code...
    
    // Join all user's group rooms
    if (currentUserId) {
        socket.emit('joinUserGroupRooms');
    }
});

// ============================================
// UPDATE YOUR LOGIN SUCCESS HANDLER
// ============================================

// Add this to your existing successful login function
async onLoginSuccess(userData) {
    // Your existing login success code...
    currentUserId = userData.userId;
    currentUsername = userData.username;
    
    // Load user's groups
    await loadUserGroups();
    
    // Join group rooms
    socket.emit('joinUserGroupRooms');
    
    // Your existing code continues...
}

// ============================================
// UPDATE YOUR CREATE GROUP MODAL HANDLER
// ============================================

// Add this event listener for your create group modal
document.querySelector('#exampleModal .btn-primary').addEventListener('click', async () => {
    const groupName = document.getElementById('recipient-name').value.trim();
    const groupDescription = document.getElementById('message-text').value.trim();
    const isPublic = false; // You can add a checkbox for this
    
    if (!groupName) {
        alert('Group name is required');
        return;
    }
    
    const groupData = {
        name: groupName,
        description: groupDescription,
        isPublic: isPublic,
        selectedUsers: [] // You can implement user selection later
    };
    
    const newGroup = await createGroup(groupData);
    
    if (newGroup) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
        modal.hide();
        
        // Clear form
        document.getElementById('recipient-name').value = '';
        document.getElementById('message-text').value = '';
        
        // Optionally open the new group chat
        openGroupChat(newGroup);
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Add this utility function if you don't have it already
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Function to clear current chat when switching between private and group
clearCurrentChat() {
    currentChatUser = null;
    currentGroupId = null;
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('typingIndicator').style.display = 'none';
    document.getElementById('typingIndicator').textContent = '';
}

// ============================================
// ADDITIONAL FEATURES YOU CAN IMPLEMENT
// ============================================

// Leave group function
async leaveGroup(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}/leave`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove from local groups list
            userGroups = userGroups.filter(g => g.id !== groupId);
            displayUserGroups();
            
            // If currently viewing this group, close it
            if (currentGroupId === groupId) {
                document.getElementById('noChatSelected').style.display = 'block';
                document.getElementById('chatInterface').style.display = 'none';
                clearCurrentChat();
            }
            
            alert('Successfully left group');
        } else {
            alert('Error leaving group: ' + data.error);
        }
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('Error leaving group');
    }
}

// Add context menu for groups (right-click functionality)
addGroupContextMenu() {
    document.addEventListener('contextmenu', (e) => {
        const groupItem = e.target.closest('.group-item');
        if (groupItem) {
            e.preventDefault();
            
            // Create context menu
            const contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            contextMenu.style.cssText = `
                position: fixed;
                top: ${e.clientY}px;
                left: ${e.clientX}px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 8px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
            `;
            
            contextMenu.innerHTML = `
                <div class="context-menu-item" style="padding: 8px 16px; cursor: pointer;">
                    Group Info
                </div>
                <div class="context-menu-item" style="padding: 8px 16px; cursor: pointer; color: red;">
                    Leave Group
                </div>
            `;
            
            document.body.appendChild(contextMenu);
            
            // Remove context menu when clicking elsewhere
            setTimeout(() => {
                document.addEventListener('click', () => {
                    if (contextMenu.parentNode) {
                        contextMenu.parentNode.removeChild(contextMenu);
                    }
                }, { once: true });
            }, 100);
        }
    });
}

// Call this function after your page loads
// addGroupContextMenu();