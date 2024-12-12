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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1towayy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const lessonsCollection = client.db("Nippon").collection("lessons");
        const vocabCollection = client.db("Nippon").collection("vocabularies");

        // middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req?.headers?.authorization?.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        }

        const verifyAdmin = async (req, res, next) => {
            const email = req?.decoded?.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ status: 'forbidden access' })
            }
            next();
        }
        // user related apis
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

        app.post('/login', async (req, res) => {
            const user = req.body;
            console.log(user);
            // const filter = { $and: [{ email: user.email }, { password: user.password }] };
            const filter = { email: user.email };
            const checkUser = await userCollection.findOne(filter);
            const verifyPass = await bcrypt.compare(user.password, checkUser.password);
            console.log(checkUser);
            if (checkUser && verifyPass) {
                const token = jwt.sign(checkUser, process.env.ACCESS_TOKEN, { expiresIn: '6h' })
                return res.send({ token, userData: checkUser, status: 'success' });
            } else {
                return res.send({ userData: {}, status: 'failed' })
            }
        })

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.patch('/users/:email/:role', async (req, res) => {
            const userEmail = req.params.email;
            const userRole = req.params.role;
            const filter = { email: userEmail };
            const update = {
                $set: {
                    role: userRole
                }
            }
            const result = await userCollection.updateOne(filter, update);
            res.send(result);
        })

        // lesson related apis

        app.post('/addlessons', verifyToken, verifyAdmin, async (req, res) => {
            // console.log(req.body);
            const lesson = req.body;
            const result = await lessonsCollection.insertOne(lesson);
            res.send(result);
        })

        app.post('/addvocabulary', verifyToken, verifyAdmin, async (req, res) => {
            const vocabulary = req.body;
            const result = await vocabCollection.insertOne(vocabulary);
            console.log(vocabulary);
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
