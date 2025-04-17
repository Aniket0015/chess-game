const express = require('express');

const route=  express.Router();
const {auth} = require('../middlewares/authMiddleware')
const {homepath,aipath,board} = require('../controllers/gameController')

 route.get('/home',auth,homepath);

route.get('/ai',auth,aipath);
route.get('/board',auth,board)
module.exports =route;