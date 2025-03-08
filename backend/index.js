const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

const PORT = 5000;

io.on("connection", (socket) => {
    socket.on("join_room", (room) => {
        socket.join(room)
    });

    socket.on("send_message", (data) => {
        io.to(data.room).emit("recieved_message", data)
    });
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});