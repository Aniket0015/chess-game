const mongoose = require('mongoose')


function connectdb(){
    const mongo_url = "mongodb://127.0.0.1:27017/gamedb";

    mongoose.connect(mongo_url);
    
      mongoose.connection.on("connected", () => {
        console.log("MongoDB connected!");
      });
}

module.exports=connectdb;