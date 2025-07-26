const mongoose = require("mongoose");
const { Socket } = require("socket.io-client");
 
const playerschema = new mongoose.Schema({
    username:{type:String, required:true , unique:true},
    password:{type:String,required:true},
    Socketid:{type:String}, // for testing  
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    gameID:[ {type:String, default: ""}]
});

module.exports= mongoose.model('player',playerschema);