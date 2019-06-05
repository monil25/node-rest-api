const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
//before signup you needto check if given email-address available for signup.

router.post('/signup', (req, res, next) => {
  User.find({
      email: req.body.email
    })
    .exec()
    .then(user => { //here user is an array. so if email is not taken it gives empty array and it is true in if condition so we use user.length
      if (user.length >= 1) {
        return res.status(409).json({
          message: "email id is taken"
        })
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId,
              email: req.body.email,
              password: hash
            })
            user
              .save()
              .then(result => {
                console.log(result)
                res.status(201).json({
                  message: "user created"
                });
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  error: err
                });
              });
          }
        });
      }
    })

});

router.post("/login", (req, res, next) => {
  User.find({
      email: req.body.email
    })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          message: 'Auth failed'
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: 'Auth failed'
          });
        }
        if (result) {
          const token = jwt.sign({
            email: user[0].email,
            userId: user[0]._id
          }, "secret", {
            expiresIn: "1h"
          });

          return res.status(200).json({
            message: 'Auth successful',
            token: token
          });

        }
        return res.status(401).json({
          message: 'Auth failed'
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


router.delete('/:userId', (req, res, next) => {
  //here checking is not whether result is empty or having data, so for any id it will say deleted
  User.remove({
      _id: req.params.userId //as named above in route
    })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "User Deleted"
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});
module.exports = router;