const http = require('http');
const socket = require('socket.io')
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require("cors")
const userroute = require('../backend/routes/playerRoutes');
const sockethandler = require('../backend/sockets/socketHandler')
const app= express();
const server = http.createServer(app);
const io = new socket.Server(server,{
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  },
  transports: ["websocket"]
});
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // your frontend Vite server
  credentials: true
}));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  }));
 sockethandler(io);

app.use('/api/user', userroute)

server.listen(5000,()=>{
    console.log("server is on port 5000");
})