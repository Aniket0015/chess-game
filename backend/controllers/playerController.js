


const sign = (req,res)=>{
    console.log("sign")
    const {name,password} = req.body;
//    const vaild =  req.userarr.find(name);
//     if(vaild) res.status(400).josn({ message: " already user"});

    req.userarr= {name,password};
    
    
   }

   const login = (req,res)=>{
    const {name,password} = req.body;
    // const valid = req.userarr.find(user => user.name === name);

    //   if(!vaild) res.status(400).josn({ message: "no user"});
    //   if(vaild[0].password!==password)  res.status(400).josn({ message: "wrong password"});
       req.session.vaild=true;
       console.log("clogn")
      
   }

   const logout = (req, res) => {
    console.log("logout")
    req.session.destroy();
    res.status(200).json({ message: 'Logged out' });
  };

  module.exports = { sign, login, logout };