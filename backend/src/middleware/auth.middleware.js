import jwt from "jsonwebtoken"

import User from "../models/user.model.js"


export const protectRoute = async (req, res, next) =>{
    try {
        //check token 
        const token = req.cookies.jwt;
        if(!token){
            res.status(401).json({message: "Unauthenicate --No token not providers"})
        }
        //verify token 
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if(!decoded){
            res.status(401).json({message: "Unauthenicate -- invalid "})
        }
        // check user in db 
        const user = await User.findById(decoded.userId).select("-password")
        if (!user){
            res.status(404).json({message: "User not found"})
        }
        req.user = user;

        next();

    } catch (error) {
        console.log("Error protectRoutes middleware");
        console.log(error);
        res.status(500).json({message: "Internal Server error"})

    }
}