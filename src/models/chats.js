import mongoose,{ model } from "mongoose";


const chatsSchema = new mongoose.Schema({
        name:{
            type: String,
            required: true,
        },
        isGroupChat:{
            type: Boolean,
            default: false,
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage"
        },
        participants:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        admin:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isBlocked:{
            type:Boolean,
            default:false
        }
},
{
    timestamps: true
});


export const Chat = mongoose.model('chats',chatsSchema);