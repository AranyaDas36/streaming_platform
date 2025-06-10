import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    wallet: {
        type: Number,
        default: 500,
        min: 0
    }
})

const User = mongoose.model('User', UserSchema);

export default User;