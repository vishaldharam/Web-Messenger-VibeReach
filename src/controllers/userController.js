import { User } from "../models/users.js"
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";


export const addNewUserToChatAppController = async (req, res) => {
   

    if (req.body === undefined) {
        res.status(404).json({ message: "Empty" });
    }
    else {
        const { name, phone, about, profilepic } = req.body


        let user = await User.findOne({ phone: phone })

        if (user) {

            const user1 = await User.findOneAndUpdate({
                _id: user._id
            },
                { name, about, profilepic })
            res.status(201).json({ status: true, user1, message: "User updated successfully" });
        }
        else {

            let user1 = await User.create({
                name,
                phone,
                about,
                profilepic,
            })

            res.status(200).json({ status: true, user1 });
        }
    }
};

export const getUserDataController = async (req, res) => {
    if (req.params === undefined) {
        res.status(404).json({  status: false,message: "Empty" });
    }

    const { phone } = req.params;
    const user = await User.findOne({ phone });

    res.status(201).json({ status: true, message: "ok", user })
};