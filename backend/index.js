const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

app.use(cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", FRONTEND_URL);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: NODE_ENV === "production" ? FRONTEND_URL : "*",
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["my-custom-header"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket'],
    allowEIO3: true, 
});

console.log(`Server starting in ${NODE_ENV} mode`);
console.log(`CORS configured for: ${FRONTEND_URL}`);

io.on("connection", async (socket) => {
    console.log("User connected:", socket.id, "Transport:", socket.conn.transport.name);
    socket.conn.on("upgrade", (transport) => {
        console.log("Transport upgraded:", transport.name);
    });

    socket.on("join_room", (data) => {
        console.log(`User ${data.user} joined room ${data.roomId}`);
        socket.join(data.roomId);
        io.to(data.roomId).emit("user_join", data);
    });

    socket.on("send_message", (data) => {
        console.log(`Message sent to room ${data.room}`);
        io.to(data.room).emit("recieved_message", data);
    });

    socket.on("disconnect", (reason) => {
        console.log("User disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
        console.log("Socket error:", error);
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
});

app.get('/', (req, res) => {
    res.status(200).send('Socket.IO server is running. Connect your WebSocket client.');
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on all interfaces at port ${PORT}`);
});