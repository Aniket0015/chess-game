const path = require('path');

function  homepath (req,res){
    res.sendFile(path.join(__dirname, '..','..', 'frontend', 'views', 'home.html'));
}
function  aipath (req,res){
    res.sendFile(path.join(__dirname, '..', '..','frontend', 'views', 'ai.html'));
}
function  board(req,res){
    res.sendFile(path.join(__dirname, '..', '..','frontend', 'views', 'board.html'));
}

module.exports={homepath,aipath,board}