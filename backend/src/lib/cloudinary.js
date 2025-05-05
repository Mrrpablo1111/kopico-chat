import {v2 as cloudinary} from "cloudinary";
import {config} from "dotenv"

config();

// Add debug logging
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_NAME ? "Set" : "Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Missing",
  api_secret: process.env.CLOUDINARY_SECRET ? "Set" : "Missing"
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Test the Cloudinary connection
cloudinary.api.ping()
  .then(result => console.log("Cloudinary connection successful:", result))
  .catch(error => console.error("Cloudinary connection failed:", error));

export default cloudinary;