
const { default: mongoose } = require("mongoose");

let isConnected = false;

const DBConnection = async () => {
    if (isConnected) {
        console.log("MongoDB already connected");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        isConnected = true;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        isConnected = false;
        throw error; // Re-throw to handle in calling function
    }
}

export default DBConnection;