import express from "express"
import authRoutes from './routes/auth.route.js'
import { connectDB } from "./lib/db.js";
import passport from "passport";
import dotenv from "dotenv"
import session from "express-session";
import messageRoutes from "./routes/message.route.js"
import cookieParser from 'cookie-parser';
import cors from "cors"



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(session({
    secret: process.env.SESSION_SECRET || 'temporary-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes);
app.listen(PORT, () => {
    console.log("Server is running on PORT:" + PORT);
    connectDB();
})