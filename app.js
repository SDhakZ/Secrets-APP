//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption")

mongoose.connect("mongodb://localhost:27017/userDB")
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ['password']
})

const User = new mongoose.model("User", userSchema);

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({
    extended: true
}))

app.get("/", function (req, res) {
    res.render('home')
})

app.get("/login", function (req, res) {
    res.render('login')
})

app.get("/register", function (req, res) {
    res.render('register')
})

app.listen("3000", function () {
    console.log("listening on 3000")
})

app.post("/register", function (req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save(function (err) {
        if (err) {
            console.log(err)
        } else {
            res.render("secrets")
        }
    });
})

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
            email: username
        },
        function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render("secrets")
                    } else {
                        console.log("fail")
                    }
                }
            }
        }
    )

})