const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    // Updated regex to allow forward slash, ampersand, and other common characters
    match: [/^[A-Za-z0-9\s.,!?'"()\-\/&:]+$/, 'Title contains invalid characters.']
  },

  description: {
    type: String,
    // Updated regex to allow forward slash, ampersand, colon and other common characters
    match: [/^[A-Za-z0-9\s.,!?'"()\-\/&:]+$/, 'Description contains invalid characters.']
  },

  image: {
    url: String,
    filename: String,
  },

  price: {
    type: Number,
    min: [0, 'Price must be a positive number.']
  },

  location: {
    type: String,
    // Updated to allow hyphens, commas and periods (for places like "New York", "St. Louis", etc.)
    match: [/^[A-Za-z\s\-,.]+$/, 'Location must contain only letters, spaces, hyphens, commas and periods.']
  },

  country: {
    type: String,
    // Updated to allow hyphens (for countries like "United Kingdom")
    match: [/^[A-Za-z\s\-]+$/, 'Country must contain only letters, spaces, and hyphens.']
  },

  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review",
  }],
   
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
geometry: {
  type: {
    type: String,
    enum: ['Point'],
    required: false
  },
  coordinates: {
    type: [Number],
    required: false
  },
},
  category: {
    type: String,
    enum: ['trending', 'rooms', 'iconic cities', 'mountains', 'beach', 'amazing pools', 'camping', 'arctic', 'doms'],
  },
  
});

// Deleting reviews if listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

// Creating model
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;