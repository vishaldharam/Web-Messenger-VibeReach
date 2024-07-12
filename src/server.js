import dotenv from 'dotenv';
import {httpServer} from './app.js'
import { connect } from 'mongoose';
import connectDB from './database/index.js'
import { app } from './app.js';
import cors from 'cors'

dotenv.config({
    path: './config.env',
})

const majorNodeVersion = +process.env.NODE_VERSION?.split('.')[0] || 0;

app.use(cors());
const startServer = () =>{
    httpServer.listen(process.env.PORT || 8080, ()=>{
        console.info(
            `Server is running on port ${process.env.PORT}`
        )
    })
};


if(majorNodeVersion >= 14){
    try {
        await connectDB();
        startServer();
        
    } catch (error) {
        console.log("Mongo DB connect error: ", error)
    }
}
else{
    connectDB().then(()=>{
        startServer();
    }).catch((err)=>{
        console.log("Mongo DB connect error: ", err)
    })
}


