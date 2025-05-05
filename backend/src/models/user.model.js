import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profileImage: {
      type: String,
      default: "",
    },
    // Added OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values and ensures uniqueness for non-null values
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;