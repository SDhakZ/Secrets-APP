//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')


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
    password: String,
    googleID: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleID: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render('home')
})

app.route('/auth/google')

    .get(passport.authenticate('google', {

        scope: ['profile'] //we want users profile

    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/login", function (req, res) {
    res.render('login')
})

app.get("/register", function (req, res) {
    res.render('register')
})

app.listen("3000", function () {
    console.log("listening on 3000")
})

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        User.find({
            secret: {
                $ne: null
            }
        }, function (err, foundUsers) {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render('secrets', {
                        usersWithSecrets: foundUsers
                    });
                }
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;
    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets")
                });
            }
        }
    })

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