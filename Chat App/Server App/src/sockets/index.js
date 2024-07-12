import cookie from 'cookie';
import { Server, Socket } from "socket.io";
import { ChatEventEnum } from "../constant.js";
import { Chat } from '../models/chats.js';
import { User } from '../models/users.js';

import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";


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


const mountParticipantTypingEvent = (socket) => {
    socket.on(ChatEventEnum.TYPING_EVENT, (chatId)=> {
        // console.log("Typing",chatId)
        socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT,chatId);
    })
}

const mountParticipantStoppedTypingEvent = (socket) => {
    

    socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
        // console.log("Typing Stopped",chatId)
      socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
    });
  };


const mountJoinChatEvent = (socket) => {
    socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
        console.log(`User joined the chat 🤝. chatId: `, chatId);
        // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
        // E.g. When user types we don't want to emit that event to specific participant.
        // We want to just emit that to the chat where the typing is happening
        socket.join(chatId);
      });
}


const initializeSocketIO = (io) => {
    
    return io.on("connection", async(socket) => {
       
        try {
            const cookies = cookie.parse(socket.handshake.headers?.cookie || "");


            let user = cookies?.user;

            if(!user){
                user = socket.handshake.auth?.user;
            }

            if(!user) {
                console.log("Un-authorized handshake. Token is invalid");
            }

            socket.user = user;

            socket.join(user._id.toString());
            socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware
            console.log("User connected 🗼. userId: ", user._id.toString());
            
            const validateUser = await User.findById(user._id);
            if(!validateUser){ console.log("Not Validated!!!")};

            const userInvolvedChats = await Chat.aggregate([
                {
                    $match: {
                        participants: {
                            $elemMatch : { $eq: validateUser._id },
                        },
                    },
                   
                }
               
            ])
            userInvolvedChats.forEach(element => {
                socket.join(element._id.toString());
            });

                  // Common events that needs to be mounted on the initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

            socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
                console.log("user has disconnected 🚫. userId: " + socket.user?._id);
                if (socket.user?._id) {
                  socket.leave(socket.user._id);
                }
              });

        } catch (error) {
            socket.emit(
                ChatEventEnum.SOCKET_ERROR_EVENT,
                error?.message || "Something went wrong while connecting to the socket."
              );
        }
    })
}



const emitSocketEvent = (req, roomId, event, payload)=>{
    req.app.get("io").in(roomId).emit(event,payload);
}

export {emitSocketEvent,initializeSocketIO}