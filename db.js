// // db.js
// const mongoose = require("mongoose");

// mongoose.connect("mongodb://localhost:27017/chatapp", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log("MongoDB connected"))
// .catch(err => console.error("MongoDB connection error:", err));

// var mongo = require('mongodb');
// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb+srv://dexterdavid835:oikHhtXUckk54Gsk@orion.d76iprj.mongodb.net/?retryWrites=true&w=majority&appName=Orion";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   console.log("Database created!");
//   db.close();
// });


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://dexterdavid835:oikHhtXUckk54Gsk@orion.d76iprj.mongodb.net/?retryWrites=true&w=majority&appName=Orion";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
