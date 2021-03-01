const express = require("express");
const cors = require("cors");
const mongodb = require("mongodb");
const generateUniqueId = require("generate-unique-id");
const bcrypt = require("bcryptjs");


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
        res.status(500).json({
            message : error
        });
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

        res.status(200).json({"id" : id});

    } catch (error) {
        res.status(500).json({
            message : error
        });
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
        res.status(500).json({
            message : error
        });
    }  
});


// delete url
app.delete("/delete/:id", async (req, res) => {
    try{
        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        await db.collection("urls").findOneAndDelete({shorturl : "short/" + req.params.id});
        await connection.close();

        res.status(200).json({ message : "Deleted!" });

    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});


// register user
app.post("/register", async (req, res) => {
    try {
        let salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(req.body.password, salt);
        let newUser = {
            firstname : req.body.fname,
            lastname : req.body.lname,
            email : req.body.email,
            password : hashPassword
        };

        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        let emailExists = await db.collection("users").find(
            {
                email : req.body.email
            }
        ).toArray();
        
        if(emailExists.length == 0)
        {
            await db.collection("users").insertOne(newUser);
            await connection.close();

            res.status(200).json({
                message : "User Created!"
            });
        }
        else
        {
            await connection.close();
            res.status(409).json({
                message : "Email already exists!"
            });
        }       

    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});

// user login
app.post("/login", async (req, res) => {
    
    try {
        let connection = await mongodb.MongoClient.connect(URL);
        let db = connection.db(DB);
        
        let user = await db.collection("users").findOne(
            {
                email : req.body.email
            }
        );
        
        if(user)
        {
            let validPassword = await bcrypt.compare(req.body.password, user.password);
            
            if(validPassword)
            {
                await connection.close();
                res.status(200).json({
                    name : user.firstname + " " + user.lastname
                });
            }
            else
                res.status(401).json({
                    message : "Wrong Password!"
                });
        }
        else
        {
            await connection.close();
            res.status(404).json({ message : "User not found!" });      
        }
    } catch (error) {
        res.status(500).json({
            message : error
        });
    }
});


app.listen(process.env.PORT || 8080);