import { Router } from "express"
import { validate } from "../validators/validate.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";
import { addParticipantInGroup, createGroupChat, createOrGetOneOnOneChatController, deleteGroupChat, deleteOneAndOneChat, getGroupChatDetails, getUserChats, leaveGroupChat, removeFromGroupChat, renameGroupChat, searchAvailableUsers } from "../controllers/chatController.js";
const chatRoutes = Router();

chatRoutes.route('/getAvailableUsers/:userId')
    .get(validate, searchAvailableUsers)

chatRoutes.route('/getUserChats/:userId')
    .get(validate, getUserChats)

chatRoutes.route('/newOneAndOneChat/:receiverId',)
    .post(mongoIdPathVariableValidator("receiverId"),
        validate,
        createOrGetOneOnOneChatController);

chatRoutes.route('/newGroupChat')
    .post(validate, createGroupChat)



chatRoutes.route('/getGroupChatDetails/:chatId')
    .get(validate, getGroupChatDetails)


chatRoutes.route('/renameGroupChatDetails/:chatId')
    .post(validate, renameGroupChat)

chatRoutes.route('/addNewParticipantToGroup/:chatId')
    .post(validate, addParticipantInGroup)

// chatRoutes.get('/getChat/',getChatValidator(),validate,getChatController);

chatRoutes.route('/deleteGroupChat/:chatId')
    .delete(validate, deleteGroupChat)

chatRoutes.route('/deleteOneAndOneChat/:chatId')
    .delete(validate, deleteOneAndOneChat)

chatRoutes.route('/leaveGroupChat/:chatId')
    .put(validate, leaveGroupChat)

chatRoutes.route('/removeUserFromGroup/:chatId')
    .put(validate, removeFromGroupChat)

export default chatRoutes;