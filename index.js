const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

//middelware
app.use(cors())
app.use(express.json())

app.get('/', async(req,res) =>{
    res.send('Car Service server is running!!!')
})

app.listen(port, ()=>{
    console.log('Car service service is running on port ',port)
})