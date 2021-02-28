const express = require("express");
const cors = require("cors");
const mongodb = require("mongodb");
const generateUniqueId = require("generate-unique-id");


const URL = "mongodb+srv://binaryblaze:1234@cluster0.v9zgd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const DB = "shorturl";

const app = express();
app.use(express.json());
app.use(cors());


// get all URLs
app.get("/urls", async (req, res) => {
    try {
        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        let urls = await db.collection("urls").find().toArray();
        await connection.close();

        res.status(200).json(urls);

    } catch (error) {
        res.status(500).send(error);
    }  
});


// generate a short url
app.post("/generateurl", async (req, res) => {
    
    try {
        const id = generateUniqueId(
            {
                length: 8,
                useLetters: true,
                useNumbers: true
            }
        );

        let newUrl = {
            shorturl : "short/" + id,
            url : req.body.longurl
        };

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        await db.collection("urls").insertOne(newUrl);
        
        await connection.close();

        res.status(200).send("short/" + id);

    } catch (error) {
        res.status(500).send("Failed to generate! " + error);
    }
});


// get the full url
app.get("/short/:id", async (req, res) => {
    try {
        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        let urls = await db.collection("urls").findOne({shorturl : "short/" + req.params.id});
        await connection.close();

        res.status(200).redirect(urls.url);

    } catch (error) {
        res.status(500).send(error);
    }  
});


app.listen(process.env.PORT || 8080, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });