const express=require('express');
const mongoose= require('mongoose');

const cookieParser=require('cookie-parser');
const db=require('./config/config').get(process.env.NODE_ENV);
const User=require('./models/user');
const {auth} =require('./middlewares/auth');

const app=express();
// app use
app.use(express.json());
app.use(cookieParser());

// database connection
mongoose.Promise=global.Promise;
mongoose.connect(db.DATABASE,{ useNewUrlParser: true,useUnifiedTopology:true },function(err){
    if(err) console.log(err);
    console.log("database is connected");
});


app.get('/code_queen',function(req,res){
    res.status(200).send(`Welcome to codequeen dashboard`);
});

// adding new user (sign-up route)
app.post('/code_queen/register',function(req,res){
    // taking a user
    const newuser=new User(req.body);
    
//    if(newuser.password!=newuser.password2)return res.status(400).json({message: "password not match"});
    
    User.findOne({email:newuser.email},function(err,user){
        if(user) return res.status(400).json({ auth : false, message :"email exits"});
 
        newuser.save((err,doc)=>{
            if(err) {console.log(err);
                return res.status(400).json({ success : false});}
            res.status(200).json({
                succes:true,
                user : doc
            });
        });
    });
 });


 // login user
app.post('/code_queen/login', function(req,res){
    let token=req.cookies.auth;
    User.findByToken(token,(err,user)=>{
        if(err) return  res(err);
        if(user) return res.status(400).json({
            error :true,
            message:"Already logged in"
        });
    
        else{
            User.findOne({'email':req.body.email},function(err,user){
                if(!user) return res.json({isAuth : false, message : ' Invalid login credentials'});
        
                user.comparepassword(req.body.password,(err,isMatch)=>{
                    if(!isMatch) return res.json({ isAuth : false,message : "invalid login credentials"});
        
                user.generateToken((err,user)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',user.token).json({
                        isAuth : true,
                        id : user._id
                        ,email : user.email,
                        token: user.token
                    });
                });    
            });
          });
        }
    });
});


//logout user
app.get('/code_queen/logout',auth,function(req,res){
    req.user.deleteToken(req.token,(err,user)=>{
        if(err)   return res.status(400).json({
            message:"Already logged out"
        });
        return res.status(200).json({
            message:"Logged out successfully"
        });
    });

}); 

// listening port
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`Server running at port ${PORT}`);
});