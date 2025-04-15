
function auth(req,res,next){
         if(req.session.vaild){
            next();
         }else{
            res.status(401).json({message:'not allowed'})
         }
}