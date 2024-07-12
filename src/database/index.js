import mongoose from "mongoose";
export let dbIntance = undefined;
import { config } from "dotenv";

config({
    path:'./config.env'
})

const connectDB = async() =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/Chat-app`);
        dbIntance = connectionInstance;
        console.log(`MongoDB connected!  DB host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Mongo URL error: ", error);
        process.exit(1);
    }
};

export default connectDB;