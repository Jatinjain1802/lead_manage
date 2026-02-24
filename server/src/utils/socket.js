const { Server } = require("socket.io");

let io;
const userSockets = new Map(); // userId -> socketId

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("authenticate", (userId) => {
      if (userId) {
        userSockets.set(Number(userId), socket.id);
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Clean up userSockets
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    const socketId = userSockets.get(Number(userId));
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
  }
  return false;
};

module.exports = {
  init,
  emitToAll,
  emitToUser,
};
