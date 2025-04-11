const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require("cors")
const userroute = require('../backend/routes/playerRoutes');
const app= express();
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  }));
  
app.use(cors({
    origin: "http://localhost:5173", // your frontend Vite server
    credentials: true
  }));
app.use('/api/user', userroute)

app.listen(5000,()=>{
    console.log("server is on port 5000");
})