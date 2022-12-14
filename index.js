require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

// middleware
//app.use(cors());
app.use(
  cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
app.use(express.json());

function verifyJWT(req, res, next) {
  const tokenInfo = req.headers.authorization;

  if (!tokenInfo) {
    return res.status(401).send({ message: "Unouthorize access" });
  }
  const token = tokenInfo.split(" ")[1];
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    } else {
      req.decoded = decoded;
      next();
    }
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gusmr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    const atorCollection = client.db("ator").collection("ator");

    app.post("/login", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_KEY);
      res.send({ token });
    });

    app.put("/ator/:id", async (req, res) => {
      const id = req.params.id;
      const updateAtor = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updateAtor.name,
          price: updateAtor.price,
          shortDescription: updateAtor.shortDescription,
          image: updateAtor.image,
          quantity: updateAtor.quantity,
          serviceProvider: updateAtor.serviceProvider,
          email: updateAtor.email,
        },
      };
      console.log(updateAtor);
      const result = await atorCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/ator/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await atorCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/myAtors", verifyJWT, async (req, res) => {
      const decodedEmail = req?.decoded?.email;
      const email = req?.query?.email;
      if (email === decodedEmail) {
        const query = { userEmail: email };
        const cursor = atorCollection.find(query);
        const ators = await cursor.toArray();
        res.send(ators);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    app.get("/ators", async (req, res) => {
      const pageNumber = Number(req.query.pageNumber);
      const limit = Number(req.query.limit);
      const count = await atorCollection.estimatedDocumentCount();
      const query = {};
      const cursor = atorCollection.find(query);
      const ators = await cursor.toArray();
      res.send(ators);
    });

    app.post("/ators", async (req, res) => {
      const newItem = req.body;
      const result = await atorCollection.insertOne(newItem);
      res.send(result);
    });
  } finally {
    // client.close();
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log("Backend server running port", port);
});
