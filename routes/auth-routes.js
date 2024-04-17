require('dotenv').config();
const express = require("express");
const router = express.Router();
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20')
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync") 

passport.serializeUser((user,done)=>{
   done(null,user.id);
});
passport.deserializeUser((id,done)=>{
    User.findById(id).then((user)=>{
        done(null,user);
    });
   
});



passport.use(
    new GoogleStrategy({
        callbackURL:'/auth/google/redirect',
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
},(accessToken,refreshToken,profile,done)=>{
    //check if user already exists in our db
    User.findOne({googleId:profile.id}).then((currUser)=>{
        if(currUser){
            //already have the user 
            console.log("user is ", currUser);
            done(null,currUser);
        }else{
            // if not create user in our db
            new User({
                username:profile.displayName,
                googleId:profile.id
            }).save().then((newUser)=>{
                console.log("new User created:" + newUser);
                done(null,newUser);
            });
        }
    })
   
}))

router.post("/signup",wrapAsync(async (req,res)=>{
    try{
        let{username,email,password} = req.body;
        const newUser = new User({email,username});
        const registeredUser = await User.register(newUser,password);
        console.log(registeredUser);
        req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","welcome to MindEchoes");
        res.redirect("/onBoarding");
       })
       
    } catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
}))




router.get("/login",(req,res)=>{
    res.render("user/login.ejs");
})

router.post("/login",passport.authenticate("local",{failureRedirect:"/login"}),(req,res)=>{
    req.flash("success","Welcome to MindEchoes");
    res.redirect("/home");
})

router.get('/google',passport.authenticate('google',{
    scope:['profile']
}));


router.get("/google/redirect",passport.authenticate('google'),(req,res)=>{
    res.redirect("/home");
})


router.get("/logout",(req,res)=>{
    req.logOut((err)=>{
        if(err) {
            return next(err);
        }
        req.flash("success","Logged you out");
        res.redirect("/");
    })
})

module.exports= router