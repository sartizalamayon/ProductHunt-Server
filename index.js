const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://product-hunt-beta.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b6ckjyi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const ProductCollection = client.db("hive").collection("ProductCollection");
    app.get('/products', async (req, res) => {
        try {
          const { search, brand, category, priceRange, sort, page = 1 } = req.query;
          const limit = 10;
          const skip = (page - 1) * limit;
      
          let query = {};
          if (search) {
            query.name = { $regex: search, $options: 'i' };
          }
          if (brand) {
            query.brand = brand;
          }
          if (category) {
            query.category = category;
          }
          if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            query.price = { $gte: min, $lte: max };
          }
      
          let sortQuery = {};
          if (sort) {
            if (sort === 'price-asc') {
              sortQuery.price = 1;
            } else if (sort === 'price-desc') {
              sortQuery.price = -1;
            } else if (sort === 'date-desc') {
              sortQuery.dateAdded = -1;
            }
          }
      
          const totalProducts = await ProductCollection.countDocuments(query);
          const products = await ProductCollection.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .toArray();
      
          res.json({
            products,
            totalPages: Math.ceil(totalProducts / limit),
          });
        } catch (error) {
          res.status(500).send('Error fetching products');
        }
      });
      
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello ProductHunt!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
