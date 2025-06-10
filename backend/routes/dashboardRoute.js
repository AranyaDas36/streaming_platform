import express from 'express';
const router = express.Router();

import { verifyToken, generateToken } from '../middleware/auth.js';

router.get("/", verifyToken, (req, res)=>{
    res.send("hey there");
})

export default router;
