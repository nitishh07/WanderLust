const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema , reviewSchema} = require("../schema.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });


router
    .route("/")
    //INDEX ROUTE
    .get(wrapAsync(listingController.index))
    //CREATE ROUTE 
    .post(isLoggedIn,upload.single('image'),validateListing, wrapAsync(listingController.createListing));

//NEW ROUTE
router.get("/new",isLoggedIn,wrapAsync (listingController.renderNewForm));

router.get("/search", wrapAsync(listingController.searchListings));

router 
    .route("/:id")
    //SHOW ROUTE
    .get(wrapAsync(listingController.showlisting))
    //UPDATE ROUTE
    .put(isLoggedIn,upload.single('image'),validateListing, isOwner, wrapAsync(listingController.updateListing))
    //Delete Route
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));




//EDIT ROUTE
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync (listingController.renderEditForm));


module.exports = router;
