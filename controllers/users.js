const User = require("../models/user");

//signup

module.exports.renderSignupForm = async (req,res)=>{
    res.render("users/signup.ejs");
};



module.exports.signup = async(req,res)=>{
    try{
    let{username , email , password} = req.body;
    const newUser = new User({email , username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err)=>{
        if(err){
        return next(err);
        }
        req.flash("success", "Welcome to Wanderlust!");
        return res.redirect("/listings");
    });
    } catch(err){
        req.flash("error", "User already registered");
        res.redirect("/signup");
    }
};


//login

module.exports.renderLoginForm = (req,res)=>{
    res.render("./users/login.ejs");
};

module.exports.login = async (req,res)=>{
    req.flash("success", "Welcome back to Wanderlust!");
    res.redirect(res.locals.redirectUrl || "/listings");
};


//logout

module.exports.logout = (req,res)=>{
    req.logout((err)=>{
        if(err){
        return  next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    });
};