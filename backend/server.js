const http = require('http');
const socket = require('socket.io')
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require("cors");
const path = require('path');
const userroute = require('../backend/routes/playerRoutes');
const gameroute = require('../backend/routes/gameRoutes');
const registerSocketEvents = require('../backend/controllers/socketController')
const app= express();
const server = http.createServer(app);
const connectDB = require('../backend/config/db')
connectDB();
const io = new socket.Server(server,{
  cors: {
    origin: "http://localhost:5000", 
    credentials: true
  },
  transports: ["websocket"]
});
app.use(express.json());
app.use(cors(
  {
  origin: "https://ead9088399e2.ngrok-free.app", // in future frontend in  Vite server
  credentials: true,
  allowedHeaders:"ngrok-skip-browser-warning"
}
));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  }));
  registerSocketEvents(io);
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/', userroute)
app.use('/', gameroute)
server.listen(5000,"0.0.0.0",()=>{
    console.log("server is on port 5000");
})