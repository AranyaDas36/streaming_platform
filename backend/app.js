import authRoute from "./routes/authRoute.js"
import dashboardRoute from './routes/dashboardRoute.js';
import videoRoute from "./routes/videoRoute.js"
import dotenv from 'dotenv';
import purchaseRoute from './routes/purchaseRoute.js';
import commentRoute from './routes/commentRoute.js'

import { verifyToken } from "./middleware/auth.js";
import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import path from 'path'


const app = express();
dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("DB connected...")
}
).catch((err)=>{
    console.log("Error occured", err);
    res.send({"Error": err})
});

app.get('/', (req, res)=>{
    res.send("hey there")
})

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/dashboard", verifyToken, dashboardRoute);
app.use("/api/v1/videos", videoRoute);
app.use('/api/v1/purchase', verifyToken, purchaseRoute);
app.use("/api/v1/comments", commentRoute);



const port = process.env.PORT || 3000;

console.log("server is runing on port", port);

app.listen(port);

