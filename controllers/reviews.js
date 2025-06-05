const Review = require("../models/review");
const Listing = require("../models/listing");
//create review route
module.exports.createReveiw = async (req,res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    listing.reviews.push(newReview); //pushing new review in array reviews

    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");

   res.redirect(`/listings/${listing._id}`);
};


//delete route

module.exports.destroyReview = async(req,res)=>{
    let { id , reviewId } = req.params;
    await Listing.findByIdAndUpdate(id ,{$pull: {reviews : reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};