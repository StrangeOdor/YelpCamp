const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    }
});

//We only define email field above because
//below line will define a user according to
//how passport does it. All we've added is email.
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);