import mongoose, { model } from "mongoose";


const userSchema = new mongoose.Schema({
    profilepic:{
        type: String,
        default: `https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg`,
           
       
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    about: {
        type: String,
        required: true,
        default: "reaching towards vibes!!",
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    lastSeen:{
        type:Date,
        default: Date.now(),
    }
},
{
    timestamps: true
}
)


export const User = mongoose.model('users',userSchema);