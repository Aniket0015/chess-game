const express = require("express");

const route = express.Router();
const {sign , login, logout} = require('../controllers/playerController');

route.post('/sign', sign);
route.post('/login',login);
route.post('/logout',logout);

module.exports = route