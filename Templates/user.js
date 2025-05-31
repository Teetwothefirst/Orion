// users.js
const users = new Map(); // socketId -> username
const usernames = new Map(); // username -> socketId

function addUser(socketId, username) {
  users.set(socketId, username);
  usernames.set(username, socketId);
}

function removeUser(socketId) {
  const username = users.get(socketId);
  if (username) usernames.delete(username);
  users.delete(socketId);
}

function getSocketIdByUsername(username) {
  return usernames.get(username);
}

module.exports = { addUser, removeUser, getSocketIdByUsername };
