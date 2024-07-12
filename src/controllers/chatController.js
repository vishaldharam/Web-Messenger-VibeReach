import mongoose from "mongoose"
import { User } from "../models/users.js";
import { Chat } from "../models/chats.js";
import { emitSocketEvent } from "../sockets/index.js";
import { ChatEventEnum } from "../constant.js";
import { asyncHandler } from "../utils/asyncHandler.js";


//common aggregation pipeline to robust our response...
const chatCommonAggregation = () =>{
    return [
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "participants",
                as: "participants",
                
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField:"_id",
                localField: "admin",
                as: "admin",
            }
        },
        {
            $lookup: {
                from: "messages",
                foreignField: "_id",
                localField: "lastMessage",
                as: "lastMessage",
                pipeline: [
                    {
                       $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "sender",
                        as: "sender",
                        pipeline: [
                            {
                                $project: {
                                    name: 1,
                                    phone: 1,
                                    profilePic: 1,
                                },
                            },
                        ],
                       },
                    },
                    {
                       $addFields: {
                        sender: { $arrayElemAt: ["$sender", 0]},
                       } ,
                    },
                ],
            },
        },
        {
            $addFields: {
                lastMessage: { $arrayElemAt: ["$lastMessage", 0]},
            },
        },
    ];
};



const createOrGetOneOnOneChatController =  async(req, res)=>{
    
    const {receiverId} = req.params;
    const {user} = req.body;


    

    //check if Its a valid reciever or not..
    let receiver = await User.findById(receiverId)
       
    if(!receiver){
        res.status(404).json({
            status:false,
            message:"receiver is not an valid User"
        })
    }
    

    //check wheather the receiver and user are not same..
    if(receiver?._id.toString() === user?._id){
        
        res.status(404).json({
            status:false,
            message:"You cannot chat with yourself"
        })
    }

    const chat = await Chat.find()

    
    const c = chat.filter((c)=> c.participants.includes(receiver?._id))
    const d = c.filter((c)=> c.participants.includes(user?._id))
  
    if(d.length){
        return res
      .status(200)
      .json({chat: chat[0], message:"Chat retrieved successfully"});
    }

    const newChatInstance = await Chat.create({
        name:"One on one chat",
        participants:[user._id, new mongoose.Types.ObjectId(receiverId)],
        admin: user._id,
    })

    //structure the chat according to commonAggregation

    const createdChat = await Chat.aggregate([
        {
            $match: {
                _id: newChatInstance._id,
            },
        },
        ...chatCommonAggregation(),
    ]);

    const payload = createdChat[0];

    if(!payload){
        res
      .status(500)
      .json({ message:"Internal Server Error"});
    }

    payload?.participants?.forEach((participant) =>{
        if (participant._id.toString() === user._id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

        // emit event to other participants with new chat as a payload
        emitSocketEvent(
          req,
          participant._id?.toString(),
          ChatEventEnum.NEW_CHAT_EVENT,
          payload
        );

        return res
        .status(201)
        .json({payload, message: "Chat created successfully"} );
    });




};


const createGroupChat = async(req, res) => {
    const {name, participants, user} = req.body;


    //check that the admin or group creater should not include in participants....
    if(participants.includes(user._id.toString())){
       return res.status(400).json({
            message:"User cannot be the part of participants as he will be taken care manually"
        })
    }

    const members = [...new Set([...participants, user._id.toString()])]; //check for duplicates

    if(members.length < 3){
        return res.status(400).json({
            message:"Seems like you have passed the duplicate participants."
        })
    }

    const groupchat = await Chat.create({
        name,
        isGroupChat: true,
        participants: members,
        admin: user._id,
    })
    if(groupchat) console.log(groupchat)

    const chat =  await Chat.aggregate([
        {
            $match: {
                _id: groupchat._id,
            },
        },
        ...chatCommonAggregation(),
    ]);

    const payload = chat[0];

    if(!payload){
        res.status(400).json({
            message:"Internal Server Error."
        })
    }

    payload?.participants?.forEach((participant)=> {
        if(participant._id.toString() === user._id) return;

        emitSocketEvent(req,
            participant._id?.toString(),
            ChatEventEnum.NEW_CHAT_EVENT,
            payload
            )
    })

    return res.status(200).json({
        message:"Group chat created successfully",
        payload
    })


}


const getGroupChatDetails = async (req, res) => {
    const { chatId } = req.params;
    const groupChat = await Chat.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chatId),
          isGroupChat: true,
        },
      },
      ...chatCommonAggregation(),
    ]);
  
    const chat = groupChat[0];
  
    if (!chat) {
        return res
      .status(400)
      .json({ message: "Group does not exists"});
    }
  
    return res
      .status(200)
      .json({ chat, message: "Group chat fetched successfully"});
  };
  
const renameGroupChat = async (req, res) => {
    const { chatId } = req.params;
    const { name, user } = req.body;
  
    // check for chat existence
    const groupChat = await Chat.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      isGroupChat: true,
    });
  
    if (!groupChat) {
        return res
        .status(400)
        .json({ message: "Group does not exists"});
    }
  
    // only admin can change the name
    if (groupChat.admin?.toString() !== user._id?.toString()) {
        return res
        .status(404)
        .json({ message: "Your are not the admin"});
    }
  
    const updatedGroupChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $set: {
          name,
        },
      },
      { new: true }
    );
  
    const chat = await Chat.aggregate([
      {
        $match: {
          _id: updatedGroupChat._id,
        },
      },
      ...chatCommonAggregation(),
    ]);
  
    const payload = chat[0];
  
    if (!payload) {
        return res
        .status(400)
        .json({ message: "Internal Server Error"});
    }
  
    // logic to emit socket event about the updated chat name to the participants
    payload?.participants?.forEach((participant) => {
      // emit event to all the participants with updated chat as a payload
      emitSocketEvent(
        req,
        participant._id?.toString(),
        ChatEventEnum.UPDATE_GROUP_NAME_EVENT,
        payload
      );
    });
  
    return res
      .status(200)
      .json({ payload, message:"Group chat name updated successfully"
      });
  };

const deleteGroupChat = async(req, res) => {
    const {chatId} = req.params;

    //check weather the chat is exist with the provided chat id..
    let gchat = await Chat.findById(chatId);
    console.log(gchat)
    if(!gchat){
        return res.status(404).json({
            message:"Chat does not exists with the provided ID"
        })
    }

    //check the user has an admin permission or not...
    if(gchat?.admin.toString() !== req.body.user?._id){
        return res.status(404).json({
            message:"You dont have the admin rights to delete the chat"
        })
    }



    const deletedChat = await Chat.findByIdAndDelete(chatId);
    if(!deletedChat){
        return res.status(404).json({
            message:"Internal Server Error"
        })
    }


    return res.status(200).json({
        message:"Group Chat is deleted successfully"
    })
    
}

const deleteOneAndOneChat = async(req, res) => {
    const {chatId} = req.params;

    //check weather the chat is exist with the provided chat id..
    let gchat = await Chat.findById(chatId);
    console.log(gchat)
    if(!gchat){
        return res.status(404).json({
            message:"Chat does not exists with the provided ID"
        })
    }

    //check the user has an admin permission or not...
    if(!gchat?.participants.includes(req.body.user._id)){
        return res.status(404).json({
            message:"You are not the part of chat which you are trying to delete..."
        })
    }



    const deletedChat = await Chat.findByIdAndDelete(chatId);
    if(!deletedChat){
        return res.status(404).json({
            message:"Internal Server Error"
        })
    }


    return res.status(200).json({
        message:"One and One Chat is deleted successfully"
    })
    
}


const leaveGroupChat = async(req, res) =>{
    const {chatId} = req.params;
    const { user } = req.body;

    const chat = await Chat.findById(chatId);
    
    if(!chat){
        return res.status(404).json({
            message:"Chat does not exist with the requested ID"
        })
    }

    const addUserDetails = await User.findById(user._id)

    if(!addUserDetails){
        return res.status(404).json({
            message:"User does not exists with the provided ID"
        })
    }

    if(!chat?.participants.includes(addUserDetails._id)){
        return res.status(404).json({
            message:"Sorry, You are not the part of the Chat"
        })
    }

    let newParticipants = chat?.participants?.filter((participant) => participant.toString() !== user._id);
    console.log(newParticipants)

    let updatedChat = await Chat.findOneAndUpdate({_id:chat._id},{participants: newParticipants});

    if(!updatedChat){
        return res.status(404).json({
            message:"Internal Server Error"
        })
    }
     updatedChat = await Chat.aggregate([
        {
            $match: {
                _id : recentlyupdatedChat[0]._id,
            },
        },
        ...chatCommonAggregation(),
    ]);

    emitSocketEvent(req, updatedChat[0]._id, ChatEventEnum.LEAVE_CHAT_EVENT, updatedChat[0]);

    return res.status(200).json({
        updatedChat,
        message:"User removed Successfully"
    })
}

const removeFromGroupChat = async(req, res) =>{
    const {chatId} = req.params;
    const { addUser, user } = req.body;

    const chat = await Chat.findById(chatId);
    
    if(!chat){
        return res.status(404).json({
            message:"Chat does not exist with the requested ID"
        })
    }

    

    const addUserDetails = await User.findById(addUser._id)

    if(!addUserDetails){
        return res.status(404).json({
            message:"User does not exists with the provided ID"
        })
    }

    if(!chat?.participants.includes(addUserDetails._id)){
        return res.status(404).json({
            message:"Sorry, You are not the part of the Chat"
        })
    }

    if(chat?.admin.toString() !== user._id){
        return res.status(404).json({
            message:"Sorry, You don't have an access to remove the user"
        })
    }

   

   

    let newParticipants = chat?.participants?.filter((participant) => participant.toString() !== addUser._id);
    // console.log(newParticipants)

    const updatedChat = await Chat.findOneAndUpdate({_id:chat._id},{participants: newParticipants});
    if(!updatedChat){
        return res.status(404).json({
            message:"Internal Server Error"
        })
    }

    const recentlyUpdatedChat = await Chat.findById(chat?._id);
   
    if(recentlyUpdatedChat?.participants.length < 2){
        await Chat.findByIdAndDelete(recentlyUpdatedChat._id);
        return res.status(400).json({
            message:"Sorry Group removed successfully"
        })
    }

   
    if(chat?.admin.toString() === addUserDetails?._id.toString()){
       
        //change the admin ..
        const newAdmin = recentlyUpdatedChat?.participants[0];
        await Chat.findOneAndUpdate({_id:recentlyUpdatedChat?._id},{admin: newAdmin})

        const updatedChat = await Chat.aggregate([
            {
                $match: {
                    _id : recentlyUpdatedChat._id,
                },
            },
            ...chatCommonAggregation(),
        ]);

        emitSocketEvent(req, updatedChat[0]._id, ChatEventEnum.LEAVE_CHAT_EVENT, updatedChat[0]);

        return res.status(200).json({
            updatedChat,
            message:"Admin is Changed and User removed Successfully"
        })
    }
    else{
        const updatedChat = await Chat.aggregate([
            {
                $match: {
                    _id : recentlyUpdatedChat._id,
                },
            },
            ...chatCommonAggregation(),
        ]);

        emitSocketEvent(req, updatedChat[0]._id, ChatEventEnum.LEAVE_CHAT_EVENT, updatedChat[0]);
        return res.status(200).json({
            updatedChat,
            message:"User removed Successfully"
        })
    }

    
}

const addParticipantInGroup = async(req, res) =>{
    const {chatId} = req.params;
    const { addUser, user } = req.body;

    const chat = await Chat.findById(chatId);
    
    if(!chat){
        return res.status(404).json({
            message:"Chat does not exist with the requested ID"
        })
    }

    

    const addUserDetails = await User.findById(addUser._id)

    if(!addUserDetails){
        return res.status(404).json({
            message:"User does not exists with the provided ID"
        })
    }

    if(chat?.participants.includes(addUserDetails._id)){
        return res.status(404).json({
            message:"Sorry, Participant is already part of the Group"
        })
    }

    if(chat?.admin.toString() !== user._id){
        return res.status(404).json({
            message:"Sorry, You don't have an access to remove the user"
        })
    }

   

   

    let newParticipants = chat?.participants;
    newParticipants.push(addUser._id);
    // console.log(newParticipants)

    let updatedChat = await Chat.findOneAndUpdate({_id:chat._id},{participants: newParticipants});
    if(!updatedChat){
        return res.status(404).json({
            message:"Internal Server Error"
        })
    }


    updatedChat = await Chat.aggregate([
    {
        $match: {
            _id : chat?._id,
        },
    },
    ...chatCommonAggregation(),
    ]);
    const payload = updatedChat[0];

    emitSocketEvent(req, updatedChat[0]._id, ChatEventEnum.ADD_NEW_PARTICIPANT_TO_GROUP, payload);
    return res.status(200).json({
    payload,
    message:"User Added Successfully"
    })


    
}



const searchAvailableUsers = async(req, res) =>{

        const {userId} = req.params;
    const allUsers = await User.aggregate([
        {
            $match:{
                _id: {
                    $ne: userId,  //avoid logged in User...
                },
            },
        },
        {
            $project: {
                profilepic: 1,
                name: 1,
                phone: 1,
                about: 1,
            },
        },
    ]);

    if(!allUsers){
        return res.status(404).json({
            message:"Internal Server Error"
        })
    }

    return res.status(200).json({
        allUsers,
        message:"Users fetched successfully",
    });
}


const getUserChats = async(req, res) => {
    const { userId } = req.params;

    
    //check if Its a valid reciever or not..
    let user = await User.findById(userId);
       
    if(!user){
        res.status(404).json({
            status:false,
            message:"receiver is not an valid User"
        })
    }


    const chats = await Chat.aggregate([
        {
            $match: {
                participants: {
                    $elemMatch : { $eq: user._id },
                },
            },
           
        },
        {
            $sort: {
                updatedAt: -1,
            }
        },

        ...chatCommonAggregation(),

    ]);


    return res
    .status(200)
    .json({
        chats,
        message:"User Chats fetched successfully!"
    })
    




}


  


export {
    createOrGetOneOnOneChatController,
    createGroupChat,
    renameGroupChat, 
    getGroupChatDetails,
    deleteGroupChat,
    searchAvailableUsers,
    deleteOneAndOneChat,
    leaveGroupChat,
    removeFromGroupChat,
    addParticipantInGroup,
    getUserChats
}