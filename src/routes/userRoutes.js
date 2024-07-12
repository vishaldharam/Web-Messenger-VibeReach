import { Router } from "express"
import { addNewUserToChatAppValidator, getUserDataVaidator } from "../validators/user.validator.js"
import { validate } from "../validators/validate.js"
import { addNewUserToChatAppController, getUserDataController } from "../controllers/userController.js"


const userRoutes = Router()

userRoutes.route('/addNewUserToChatApp').post(addNewUserToChatAppValidator(),validate, addNewUserToChatAppController)
userRoutes.route('/ /:phone').get(getUserDataVaidator(), validate, getUserDataController)
// userRoutes.route('/updateUserData/:phone').put(getUserDataVaidator(), validate, updateUserToChatAppController)
// userRoutes.route('/deleteUserData/:phone').delete(getUserDataVaidator(), validate, deleteUserDataController)


export default userRoutes