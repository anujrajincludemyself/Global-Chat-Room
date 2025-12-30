const express = require('express')
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const ChatMessage = require("./models/chatMessage");
const app = express()

const server = http.createServer(app);
const io = new Server(server, {
    // change origin to your React dev origin
  cors: { origin: "http://localhost:3000", methods: ["GET","POST"] } 
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple route to get saved messages
app.get("/messages", async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("GET /messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    try {
      const { user, message } = data;
      const chatMessage = new ChatMessage({ user, message });
      await chatMessage.save();
      // Emit to everyone (including sender)
      io.emit("message", chatMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("A user disconnected:", socket.id, reason);
  });
});

async function start() {
  try {
    await mongoose.connect("Your Mongo URI");
    console.log("MongoDB connected");

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}
start();    