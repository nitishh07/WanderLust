//INSERTING DATA from DATA.JS file

const mongoose = require('mongoose');
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
main()
.then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});

async function main() {
  await mongoose.connect(MONGO_URL);
}


const initDB = async ()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({
        ...obj, owner : "6831e7bd5a3e106b6e7ec3a3"
    }))
    await Listing.insertMany(initData.data);  //key data ko access krna hai to .data 
    console.log("data was intialized");
};

initDB(); //calling init db function
