import {body, param} from 'express-validator';

export const addNewUserToChatAppValidator = () =>{
    return [
        body("name")
            .notEmpty()
            .trim()
            .withMessage("Your name is required"),
        body("phone")
            .notEmpty()
            .withMessage("Phone number is required")
            .isLength({ min:10, max:10})
            .withMessage("Phone number should be of 10 digits"),
        body("about")
            .notEmpty()
            .withMessage("About is required"),
       
    ];
};

export const getUserDataVaidator = () =>{
    return [
        param("phone")
            .notEmpty()
            .isLength({ min : 10, max : 10 })
            .withMessage("Invalid request!")
    ]
}