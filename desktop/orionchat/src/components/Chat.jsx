import React from 'react'

export default function Chat() {
  return (
    <>
       {/* <!-- Chat Interface --> */}
        <div id="chatContainer" className="chat-container">
            {/* <!-- Sidebar with users list --> */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h3 id="currentUsername">Welcome</h3>
                    <div className="user-info">Online now</div>
                    <button id="logoutBtn" className="logout-btn">Logout</button>
                    <button className="logout-btn">Settings</button>
                </div>
                
                <div className="sidebar-tabs">
                    {/* <!-- <div className="slider"></div> --> */}
                    {/* <!-- <button className="sidebar-tab active" id="usersTab">Users</button>
                    <button className="sidebar-tab" id="groupsTab">Groups</button> --> */}
                     <ul className="nav nav-pills p-2" id="pills-tab" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button className="nav-link active" id="pills-home-tab" data-bs-toggle="pill" data-bs-target="#pills-home" type="button" role="tab" aria-controls="pills-home" aria-selected="true">Users</button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className="nav-link" id="pills-profile-tab" data-bs-toggle="pill" data-bs-target="#pills-profile" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Group</button>
                            </li>
                        </ul>
                </div>
                
                <div className="sidebar-content">
                    {/* <!-- users-list --> */}
                    {/* <!-- <div className="content-window active" id="usersList"> --> */}
                        
                        <div className="tab-content" id="pills-tabContent">
                            <div className="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab" >{/*tabindex="0"*/}

                            </div>
                            <div className="tab-pane fade" id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab" >{/** tabindex="0"*/}
                                <button type="button" className="create-group-btn btn" id="createGroupBtn" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="creategroup">+ Create Group</button>
                                {/* <!-- <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="@mdo">Open modal for @mdo</button> --> */}
                                <div className="modal fade" id="exampleModal" aria-labelledby="exampleModalLabel" aria-hidden="true">{/* tabindex="-1"*/}
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                    <div className="modal-header">
                                        <h1 className="modal-title fs-5" id="exampleModalLabel">Create Group</h1>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div className="modal-body">
                                        <form>
                                        <div className="mb-3">
                                            {/* <label htmlFor="recipient-name" className="col-form-label">Group Name:</label> */}
                                            <input type="text" className="form-control" id="recipient-name" />
                                        </div>
                                        <div className="mb-3">
                                            {/* <label for="message-text" className="col-form-label">Group Description:</label> */}
                                            <textarea className="form-control" id="message-text"></textarea>
                                        </div>
                                        <div className="mb-3">
                                            {/* <label for="select-user" className="col-form-label">Select Users:</label> */}
                                            {/* <select className="form-select" aria-label="Default select example">
                                                <option selected>------------------</option>
                                                <option value="1">One</option>
                                                <option value="2">Two</option>
                                                <option value="3">Three</option>
                                            </select> */}
                                        </div>
                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                        <button type="button" className="btn btn-primary" id="">Create Group</button>
                                    </div>
                                    </div>
                                </div>
                                </div>
                                <div className="comingsoon d-flex justify-content-center text-danger">Coming Soon</div>
                            </div>
                            
                        </div>
                    {/* <!-- </div> -->
                    <!-- groups-list -->
                    <!-- <div className="content-window" id="groupsList">
                        <button className="create-group-btn" id="createGroupBtn">+ Create Group</button>
                        
                    </div> --> */}
                </div>
            </div>

            {/* <!-- Chat area --> */}
            <div className="chat-area">
                <div id="noChatSelected" className="no-chat-selected">
                    Select a user to start chatting
                </div>
                
                <div id="chatInterface">
                    {/* style="display: none; flex: 1; display: flex; flex-direction: column;overflow: scroll;" */}
                    <div className="chat-header">
                        <h4 id="chatWithUser">Chat with User</h4>
                        <div id="typingIndicator" className="typing-indicator"></div>
                    </div>
                    
                    <div className="messages-container" id="messagesContainer">
                        {/* <!-- Messages will appear here --> */}
                    </div>
                    
                    <div className="message-input-container">
                        <input type="text" id="messageInput" className="message-input" placeholder="Type your message..." />
                        <button id="sendBtn" className="send-btn">Send</button>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}
