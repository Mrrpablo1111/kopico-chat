import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
//SignUp 
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profileImage: newUser.profileImage,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//LogIn
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credential" })
    }
    // compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Password" })
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      pictureImage: user.profileImage,
    });
  } catch (error) {
    console.log("Errror in login ", error.message);
    res.status(500).json({ message: "Server Internal Error" })
  }
}
//LogOut
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//UploadImage
export const updateProfile = async (req, res) => {
  try {
    const { profileImage } = req.body;
    //check userId from database
    const userId = req.user._id;
    
    if (!profileImage) {
      return res.status(400).json({ message: "Profile image is required" });
    }

    //follow structure from cloudinary 
    const uploadResponse = await cloudinary.uploader.upload(profileImage);
    const updateUser = await User.findByIdAndUpdate(
      userId, 
      { profileImage: uploadResponse.secure_url }, 
      { new: true }
    );
    
    return res.status(200).json(updateUser);
  } catch (error) {
    console.log("Error UploadProfile", error.message);
    return res.status(500).json({ message: "Error Internal Server" });
  }
}

//Check Auth

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" })
  }
}


// Configure Passport with Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5500/api/auth/google/callback"
},
  async function (accessToken, refreshToken, profile, done) {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Create new user if they don't exist
        user = new User({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          profileImage: profile.photos[0].value,
          password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10) // Random password
        });
        await user.save();
      } else if (!user.googleId) {
        // If user exists but doesn't have googleId, update it
        user.googleId = profile.id;
        user.profileImage = user.profileImage || profile.photos[0].value;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth login route
export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  state: 'login'
});

// Google OAuth Signup route

export const googleSignup = passport.authenticate('google', {
  scope: ['profile', 'email'],
  state: 'signup'
})

// Google OAuth callback route
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=authentication-failed`);

    try {
      // Check if this is a signup flow by checking the state parameter
      const isSignup = req.query.state === 'signup';

      // For signup: if account already exists (has googleId), redirect to signup with error
      if (isSignup && user.googleId) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/signup?error=account-exists`);
      }

      // Generate JWT token for OAuth user
      generateToken(user._id, res);

      if (isSignup) {
        // New signup - redirect to home page
        console.log("New user signed up via Google:", user.email);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/`);
      } else {
        // Login flow - redirect to home page or dashboard
        console.log("User logged in via Google:", user.email);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/`);
      }
    } catch (error) {
      console.log("Error in Google callback:", error.message);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=server-error`);
    }
  })(req, res, next);
};
