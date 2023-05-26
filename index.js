const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
require('dotenv').config()
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.85env82.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// jwt verify function is here
const verifyJwt =(req, res, next)=>{
  if(!req.headers.authtoken){
      return res.send({error:true, message: "unothorized access!"});
  };
  const Token = (req.headers.authtoken).split(" ")[1];
  jwt.verify(Token, process.env.ACCESS_TOKEN_SECRECT, (error,decoded)=>{
    if(error){
      res.send({error:true, message:"unothorized access"});
    };
    req.decoded = decoded;
    next();
  });
  

};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const services = client.db("CarDoctor").collection("services");
    const checkOut = client.db("CarDoctor").collection("CheckOut");

    // create jwt token
    

    app.get("/services", async(req, res)=>{
        const query = {};
        const option = {
            projection:{img:1, price:1, title:1}
        }
        const result = await services.find(query,option).toArray();
        res.send(result);
    });

    app.get("/service/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await services.findOne(query);
      res.send(result);
    });

    app.get("/checkoutService/:email",verifyJwt, async(req,res)=>{
      const email = req.params.email;
      const tokenEmail = req.decoded.email;
      if(email === tokenEmail){
        console.log(tokenEmail);
        const query = {email: email};
        const result = await checkOut.find(query).toArray();
        res.send(result);
      }else{
        res.send({error:true, message:"forbidden user"})
      };
      
      
    });

    app.post("/services",async(req,res)=>{
      const service = req.body;
      const result = await services.insertOne(service);
      res.send(result);
    });

    app.post("/checkout",async(req,res)=>{
      const checkout = req.body;
      const result = await checkOut.insertOne(checkout);
      res.send(result);
    });

    app.delete("/servicedelete/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await services.deleteOne(query);
      res.send(result);
    });

    app.delete("/checkout/:id", async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await checkOut.deleteOne(query);
        res.send(result);
    });


    app.put("/checkout/:id", async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const update = { 
          $set:{
            confirm:true
          }
        };

        const result = await checkOut.updateOne(query,update);
        res.send(result);
    });

    app.post("/jwt", (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT,{expiresIn: "1h"})
      res.send({token});
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/",(req, res)=>{
    res.send("Service is runnig well!");
});


app.listen(port,()=>{
    console.log(`Server is runnig with ${port}`);
});