import mongoose from "mongoose";

const dbConnection = () =>{
    const url = process.env.MONGODB_URI as string;
    mongoose.connect(url)
        .then(() => console.log("mongodb connected..."))
        .catch((err) => console.log("Error in connected db", err))
}

export default dbConnection;