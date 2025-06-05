const Listing = require("../models/listing");
const axios = require('axios'); // Make sure to install: npm install axios

// Geocoding helper function
async function geocodeLocation(location, country) {
    try {
        const fullLocation = `${location}, ${country}`;
        
        const response = await axios.get(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(fullLocation)}.json`,
            {
                params: {
                    key: process.env.MAPTILER_API_KEY,
                    limit: 1
                },
                timeout: 10000 // 10 second timeout
            }
        );

        if (response.data.features && response.data.features.length > 0) {
            const coordinates = response.data.features[0].center;
            return {
                type: 'Point',
                coordinates: coordinates // [longitude, latitude]
            };
        }
        
        console.log('No geocoding results found, using default coordinates');
        // Return default coordinates if no results
        return {
            type: 'Point',
            coordinates: [77.2088, 28.6139] // Default to Delhi, India
        };
    } catch (error) {
        console.error('Geocoding error:', error.message);
        // Return default coordinates on error
        return {
            type: 'Point',
            coordinates: [77.2088, 28.6139] // Default to Delhi, India
        };
    }
}

//index route
module.exports.index = async (req, res) => {
    const { category } = req.query;

    let allListings;
    if (category) {
        allListings = await Listing.find({ category: category });
    } else {
        allListings = await Listing.find({});
    }
    res.render("listings/index", { 
        allListings, 
        selectedCategory: category,
        currUser: req.user // ✅ Added currUser
    });
};

//new route
module.exports.renderNewForm = async(req,res) => {
    res.render("listings/new.ejs", {
        currUser: req.user // ✅ Added currUser
    });
};

//edit route 
module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    
    if(!listing){
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }
    
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_300,h_250,c_fill");
    res.render("listings/edit.ejs", {
        listing, 
        originalImageUrl,
        currUser: req.user // ✅ Added currUser
    });
};

//show route
module.exports.showlisting = async (req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path : "reviews", 
            populate: {path : "author"},
        })
        .populate("owner"); 
         
    if(!listing){
        req.flash("error", "Listing you requested for does not exist !");
        return res.redirect("/listings");
    }
    
    res.render("listings/show.ejs", {
        listing, 
        mapTilerApiKey: process.env.MAPTILER_API_KEY,
        currUser: req.user // ✅ Added currUser
    });
};

// Search route
module.exports.searchListings = async (req, res) => {
  const { query = '' } = req.query;

  try {
    const searchRegex = new RegExp(query, 'i');

    const listings = await Listing.find({
      $or: [
        { title: { $regex: searchRegex } },
        { location: { $regex: searchRegex } },
        { country: { $regex: searchRegex } }
      ]
    });

    if (listings.length === 0) {
      req.flash("error", "No listings found.");
      return res.redirect("/listings");
    }

    res.render("listings/index.ejs", {
      allListings: listings,
      selectedCategory: null,
      currUser: req.user // ✅ Added currUser
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong with the search.");
    res.redirect("/listings");
  }
};

//create route 
module.exports.createListing = async (req, res, next) => {
    try {
        let url = req.file.path;
        let filename = req.file.filename;
        console.log(url, "..", filename);
        
        let { title, description, price, country, location} = req.body.listing;
        let { category } = req.body.listing;
        
        // Geocode the location to get coordinates
        console.log('Creating new listing, geocoding location...');
        const geometry = await geocodeLocation(location, country);
        
        const newListing = new Listing({
            title,
            description,
            image : {
                url : url,
                filename : filename,
            },
            price,
            country,
            location,
            category,
            owner : req.user.id,
            geometry: geometry // ✅ Now uses actual geocoded coordinates
        });
        
        await newListing.save();
        console.log(`New listing created with coordinates: [${geometry.coordinates[0]}, ${geometry.coordinates[1]}]`);
        
        req.flash("success", "New Listing Created!");
        console.log(newListing);
        res.redirect("/listings");
        
    } catch (error) {
        console.error('Error creating listing:', error);
        req.flash("error", "Something went wrong while creating the listing!");
        res.redirect("/listings/new");
    }
};

//update route 
module.exports.updateListing = async (req, res) => {
    try {
        let { id } = req.params;
        let {
            title,
            description,
            price,
            country,
            location,
            category,
        } = req.body.listing;

        // Get the current listing to check if location changed
        const currentListing = await Listing.findById(id);
        
        if(!currentListing){
            req.flash("error", "Listing you requested for does not exist !");
            return res.redirect("/listings");
        }

        // Prepare the update object
        let updateData = {
            title,
            description,
            price,
            country,
            location,
            category,
        };

        // If location or country changed, re-geocode
        if (currentListing.location !== location || currentListing.country !== country) {
            console.log('Location changed, re-geocoding...');
            console.log(`Old: ${currentListing.location}, ${currentListing.country}`);
            console.log(`New: ${location}, ${country}`);
            
            const geometry = await geocodeLocation(location, country);
            updateData.geometry = geometry;
            console.log(`Updated coordinates: [${geometry.coordinates[0]}, ${geometry.coordinates[1]}]`);
        }

        // If a file was uploaded, update the image field
        if (req.file !== undefined) {
            updateData.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        const updatedListing = await Listing.findByIdAndUpdate(
            id,
            updateData,
            { runValidators: true, new: true }
        );
 
        console.log('Listing updated successfully');
        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
        
    } catch (error) {
        console.error('Error updating listing:', error);
        req.flash("error", "Something went wrong while updating the listing!");
        res.redirect(`/listings/${req.params.id}/edit`);
    }
};

//delete route 
module.exports.destroyListing = async (req,res) => {
    try {
        let {id} = req.params;
        let deletedlisting = await Listing.findByIdAndDelete(id);
        
        if(!deletedlisting){
            req.flash("error", "Listing you requested for does not exist !");
            return res.redirect("/listings");
        }
        
        console.log('Deleted listing:', deletedlisting.title);
        req.flash("success", "Listing Deleted");
        res.redirect("/listings");
        
    } catch (error) {
        console.error('Error deleting listing:', error);
        req.flash("error", "Something went wrong while deleting the listing!");
        res.redirect("/listings");
    }
};