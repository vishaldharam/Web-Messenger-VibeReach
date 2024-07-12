import { Router } from "express"
import { validate } from "../validators/validate.js";
import { getAllMessages, sendMessage } from "../controllers/messageControllers.js";

const messageRoutes = Router();

messageRoutes.route('/getAllMessages/:chatId')
    .post(getAllMessages)

messageRoutes.route('/sendMessage/:chatId')
    .post(validate, sendMessage)

export default messageRoutes
