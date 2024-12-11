const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1towayy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;;

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
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const userCollection = client.db("Nippon").collection("users");

        app.post('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const check = await userCollection.findOne(filter);
            console.log(check);
            if (check) {
                return res.send({ status: 'duplicate' })
            };
            user.password = await bcrypt.hash(user?.password, 10);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

app.get('/', async (req, res) => {
    res.send('server is running with mongodb connected')
})


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
run().catch(console.dir);
