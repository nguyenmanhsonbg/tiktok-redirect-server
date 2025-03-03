const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://manhnguyen3122:Manh031220@cluster0.rq4vw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let client;
let dbInstance;

// Kết nối MongoDB sử dụng biến toàn cục (global) để tránh tạo nhiều kết nối
async function connectDB() {
  if (!dbInstance) {
    if (!client) {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
    }
    dbInstance = client.db("productDatabase");
    console.log("✅ Connected to MongoDB");
  }
  return dbInstance;
}

module.exports = connectDB;
