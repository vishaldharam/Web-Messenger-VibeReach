import mongoose from "mongoose";
import { ChatEventEnum } from "../constant.js";
import { Chat } from "../models/chats.js";
import { ChatMessage } from "../models/messages.js";
import { emitSocketEvent } from "../sockets/index.js";

/**
 * @description Utility function which returns the pipeline stages to structure the chat message schema with common lookups
 * @returns {mongoose.PipelineStage[]}
 */
const chatMessageCommonAggregation = () => {
  return [
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
              profilePic: 1,
              phone: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
  ];
};

const getAllMessages = async (req, res) => {
  const { chatId } = req.params;
  console.log(chatId);
  const {user} = req.body;
  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
   return res.status(400).json({
    message:"Chat does not exist"
   });
  }

  // Only send messages if the logged in user is a part of the chat he is requesting messages of
  if (!selectedChat.participants?.includes(user?._id)) {
    return res.status(400).json({
      message:"User is not a part of this chat"
     });
  }

  const messages = await ChatMessage.aggregate([
    {
      $match: {
        chat: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...chatMessageCommonAggregation(),
    {
      $sort: {
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json({
      messages , message:"Messages fetched successfully"
    })
    
};

const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  let { content, user, attachments } = req.body;

  // if (!content && !req.files?.attachments?.length) {
  if(!content && !attachments){  
  return res.status(400).json({
      message:"Message content or attachment is required"
     });
  }

  if(!content && attachments){  
      content = ""
    }

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    return res.status(400).json({
      message:"Chat does not exist"
     });
  }

  const messageFiles = [];

  if (attachments) {
    messageFiles.push(JSON.stringify(attachments))
  }

  // Create a new message instance with appropriate metadata
  const message = await ChatMessage.create({
    sender: new mongoose.Types.ObjectId(user._id),
    content: content || "",
    chat: new mongoose.Types.ObjectId(chatId),
    attachments: messageFiles,
    
  });

  // update the chat's last message which could be utilized to show last message in the list item
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        lastMessage: message._id,
      },
    },
    { new: true }
  );

  // structure the message
  const messages = await ChatMessage.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(message._id),
      },
    },
    ...chatMessageCommonAggregation(),
  ]);

  // Store the aggregation result
  const receivedMessage = messages[0];

  if (!receivedMessage) {
    return res.status(400).json({
      message:"Internal Server Error!"
     });
  }

  // logic to emit socket event about the new message created to the other participants
  chat.participants.forEach((participantObjectId) => {
    // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    // avoid emitting event to the user who is sending the message
    if (participantObjectId.toString() === user._id.toString()) return;

    // emit the receive message event to the other participants with received message as the payload
    emitSocketEvent(
      req,
      participantObjectId.toString(),
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      receivedMessage
    );

    console.log(' @@@ Msg Send Successfully @@@@');
  });

  return res
    .status(201)
    .json({
      receivedMessage, message:"Message saved successfully"
    });
};

export { getAllMessages, sendMessage };
