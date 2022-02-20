//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({
    extended: true
}))


app.use(session({
    secret: 'OurSecretLOL',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/")

})

app.post("/register", function (req, res) {

    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {

        if (err) {

            console.log("Error in registering.", err);

            res.redirect("/register");

        } else {

            passport.authenticate("local")(req, res, function () {

                console.log(user, 101);

                res.redirect("/secrets");

            });

        }
    });

});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }
    })

})