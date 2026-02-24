const userModel = require("../models/userModel");
const socket = require("../utils/socket");

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, name, role, canViewChat } = req.body;
    const userId = await userModel.createUser({ username, password, name, role, canViewChat });
    res.status(201).json({ id: userId, message: "User created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, role, canViewChat, isActive } = req.body;

    const oldUser = await userModel.findById(id);
    if (!oldUser) return res.status(404).json({ error: "User not found" });

    await userModel.updateUser(id, { name, role, canViewChat, isActive });
    const updatedUser = await userModel.findById(id);

    // REAL-TIME NOTIFICATIONS
    
    // 1. Check for deactivation
    if (isActive === false && oldUser.is_active !== false) {
      socket.emitToUser(id, 'account_deactivated');
    }

    // 2. Check for permission changes
    if (canViewChat !== undefined && canViewChat !== oldUser.can_view_chat) {
      socket.emitToUser(id, 'permissions_updated', { can_view_chat: canViewChat });
    }

    // 3. For any other role change, etc.
    if (role !== undefined && role !== oldUser.role) {
      socket.emitToUser(id, 'permissions_updated', { role });
    }

    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
};
