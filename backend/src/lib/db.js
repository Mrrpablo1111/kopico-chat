import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connection is succesefuly: ${conn.connection.host}`);
    } catch (error) {
        console.log('Mongoose DB is error', error);
    }
}