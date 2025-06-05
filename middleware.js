
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");


module.exports.isLoggedIn = (req, res,next)=>{
     if(!req.isAuthenticated()){   //check if user is logged in
        //redirect Url 
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in!");
        return res.redirect("/login");
    }
    next();
}

//accessing redirect url using req.locals

module.exports.saveRedirectUrl = (req,res, next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }
    next();
};


//isOwner

module.exports.isOwner = async (req,res, next)=>{
    let {id} = req.params;
     let listing = await Listing.findById(id);
     if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};


//Validate Listing
module.exports.validateListing = (req,res,next)=>{
    let {error} = listingSchema.validate(req.body);

    if(error){
        let errMsg = error.details.map((el)=>{
            return el.message
        }).join(",");
        throw new ExpressError(400, errMsg);
    } else{
        next();
    }
};


//isReviewAuthor

module.exports.isReviewAuthor = async (req,res, next)=>{
    let {id , reviewId} = req.params;
     let review = await Review.findById(reviewId);
     if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the author of this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};



