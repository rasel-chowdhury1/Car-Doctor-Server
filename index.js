const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const jwt = require('jsonwebtoken');

//middelware
app.use(cors())
app.use(express.json())



// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jz0ivtr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) =>{
   const authorization = req.headers.authorization;
   if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'})
   }
   const token = authorization.split(" ")[1];
  //  console.log("token inside Verify JWT ", token);
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
    if(error){
      return res.status(403).send({error:true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
   })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('CarDoctor').collection('services')
    const bookingCollection = client.db('CarDoctor').collection('bookings')
    
    //JWT
    app.post('/jwt', (req,res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      console.log(token)
      res.send({token});
    })


    //Services routes
    app.get('/services', async(req,res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    } )

    app.get(`/services/:id`, async(req,res) =>{
      const id = req.params.id;
      // console.log(id)
      const query = {_id: new ObjectId(id)}

      const result = await serviceCollection.findOne(query);
      res.send(result);
    })

    //bookings routes

    app.get('/booking', verifyJWT, async(req,res) =>{
      // console.log(req.headers.authorization);
      const decoded = req.decoded
      console.log("came back after verify",decoded);
      console.log(req.query.email)

      if(decoded.email !== req.query.Email){
        return res.status(403).send({error: 1, message: 'forbidden access'})
      }

      let query = {};
      if(req.query?.Email){
        query = {Email: req.query.Email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })


    app.post('/booking', async(req,res) =>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking)
      res.send(result);
    })

    app.patch('/bookings/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)}
      const updateBooking = req.body;
      console.log(updateBooking);
      const updateDoc = {
        $set:{
          status: updateBooking.status
        }
      };
      const result = await bookingCollection.updateOne(filter,updateDoc);
      res.send(result);
    })

    app.delete('/bookings/:id', async(req,res) =>{
      const id = req.params.id;
      console.log('delete : - ',id);
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req,res) =>{
    res.send('Car Service server is running!!!')
})

app.listen(port, ()=>{
    console.log('Car service service is running on port ',port)
})