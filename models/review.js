const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    body:String,
    rating:Number,
});

module.exports = mongoose.model('Review',reviewSchema);
/* 
Even though this is a practice app and we will not have
thousands of reviews...We are designing this schema anticipating
that we would get a lot. So, rather than querying a bunch of
reviews independently, we will attach them to our
campgrounds with Object IDs, and then populate.
*/