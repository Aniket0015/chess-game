
export const  auth = (req,res,next)=>{
         if(req.session.valid){
            next();
         }else{
            res.status(401).json({message:'not allowed'})
         }
}