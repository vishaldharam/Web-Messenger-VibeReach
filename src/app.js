import express from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";

import cookieParser from 'cookie-parser';
import  cors  from 'cors'
import { rateLimit } from 'express-rate-limit';
import { config } from 'dotenv';
import requestIp from 'request-ip';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { json } from 'express';
import { initializeSocketIO } from './sockets/index.js';
import bodyParser from 'body-parser';
export const app = express()

app.use(cookieParser())




//configure the process.env files
config({
    path:'./config.env',
})



const httpServer = createServer(app)
// this is an Socket.IO server instance for handling web socket req/res...


//global middleware
app.use(
  //this cors is for the regular http request/response with credential true means...
  //we are allows the headers with request like cookie etc,
  cors({
    origin: '*',
    credentials:true,
  })
  );
  


const io = new Server(httpServer, {
    //this cors is for the web sockets request/response handling...
    cors:{
        origin: '*',
        credentials: true
    }
})


//its sets the named value in express application setting.
//here we have set the socket.io server instance along with the key "io",
//this helps us to use the io instace globally from any part of our application.
app.set("io",io)

// Enable CORS for all routes


  
  
  
  
  app.use(requestIp.mw());
  
  // // // Rate limiter to avoid misuse of the service and avoid cost spikes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 5000 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req, res) => {
      return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
    },
    handler: (_, __, ___, options) => {
      throw new ApiError(
        options.statusCode || 500,
        `There are too many requests. You are only allowed ${
          options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

// // // Apply the rate limiting middleware to all requests
app.use(limiter);


//limit of the json-encoded payload which server can except.
app.use(express.json())
app.use(bodyParser.json({limit: '100mb'}));
//limit the url-encoded request header or payload limit 
app.use(express.urlencoded({ extended:true, limit: '100mb'}))

//configure the static file to save image locally   
app.use(express.static("public"))



initializeSocketIO(io);

//all apis..
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chats',chatRoutes)
app.use('/api/v1/messages',messageRoutes)


export {httpServer};







