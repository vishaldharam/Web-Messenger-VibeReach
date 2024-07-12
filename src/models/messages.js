import mongoose from "mongoose";


const messageSchema = mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    chat:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
    },
    content: {
        type: String,
    },
    attachments: {
        type: Array,
        default: [],
    },
    status:{
        type:String,
        default: "Not send!",
    }

},
{
    timestamps: true
});

export const ChatMessage = mongoose.model('messages',messageSchema);