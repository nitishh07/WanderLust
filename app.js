if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path"); //for views folder
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); //req.params
app.use(methodOverride("_method"));

// use ejs-locals for all ejs templates:
app.engine('ejs', ejsMate);

// for css and styling 
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());

// Mongo session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR IN MONGO SESSION STORE");
});

// express-session 
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //ms 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

// Using Flash
app.use(session(sessionOptions));
app.use(flash());

// PASSPORT for authentication
app.use(passport.initialize());  //Socho passport ek security guard hai. passport.initialize() us guard ko duty pe lagata hai.
app.use(passport.session());   //ek baar login kare, toh baar-baar login na karna pade jab tak session active hai.
passport.use(new LocalStrategy(User.authenticate()));  //Yeh guard ko batata hai ki "login check karne ka rule yeh hai: username aur password database se milao."
passport.serializeUser(User.serializeUser());    //user se related info store krwane ko seralize bolte hai
passport.deserializeUser(User.deserializeUser()); //Jab request aati hai (jaise user koi page access kare), to ye session wali ID se full user info database se laata hai.

//  currUser ko navbar.ejs me dikhane ke liye res.locals set krna hoga (AFTER passport middleware)
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

// ROOT ROUTE - This is the main fix for "Page Not Found" error
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// DEMO USER - AUTHENTICATION
// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User({
//         email : "student@gmail.com",
//         username : "delta-student",
//     });

//     let registeredUser = await User.register(fakeUser, "helloworld");  //helloworld is password
//     res.send(registeredUser);
// });

// Using listings and reviews by storing it into other file
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// app.get("/testlisting",async (req, res)=>{
//     let samplelisting = new Listing({
//         title : "My new Villa",
//         description : "By the Beach",
//         price : 1200,
//         location : "Calangutte, Goa",
//         country : "India",
//     });

//     //SAVING THE DATA
//     await samplelisting.save();
//     console.log("Sample was saved !");
//     res.send("Successful testing !");
// });

// ERROR HANDLING

// Catch-all route for undefined routes
// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found!"));
// });

// Error handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    
    // Check if it's a render error and handle gracefully
    if (res.headersSent) {
        return next(err);
    }
    
    // Try to render error page, fallback to simple response
    try {
        res.status(statusCode).render("listings/error", { err });
    } catch (renderError) {
        console.error("Error rendering error page:", renderError);
        res.status(statusCode).send(`Error ${statusCode}: ${message}`);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
});