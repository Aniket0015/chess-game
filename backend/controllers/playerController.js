const Player = require('../models/Player'); 
const mongoose = require('mongoose');
const sign = async (req, res) => {
  console.log("sign");
  const { name, password } = req.body;
  const existing =  await Player.findOne({username:name});
  if (existing)   return res.status(400).json({ message: " username already exists. choose a different one." });
  else {
  
  const user = new Player({username:name, password})
  console.log("sign", req.body);
   await user.save();
   return res.status(200).json({ redirect:"/login.html" });
  }
};

const login = async  (req, res) => {
  const { name, password } = req.body;
  const existing =  await Player.findOne({username:name});

  if (!existing) return res.redirect("http://localhost:5000/sign.html");
  if (existing.password !== password)
    return res.status(400).json({ message: "wrong password" });
  req.session.valid = true;
  req.session.id=name;
  console.log(req.body);
  return res.redirect("/home") ;
};

const logout = (req, res) => {
  console.log("logout");
  req.session.destroy();
  return res.status(200).json({ message: "Logged out" });
};

module.exports = { sign, login, logout };
