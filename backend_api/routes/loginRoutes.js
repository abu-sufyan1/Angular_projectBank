const express = require('express')
const router = express.Router()
const jwt = require("jsonwebtoken");

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const User = require('../models/User')


// route to register user and upload profile image
router.post("/login", async (req, res, next) => {
    const file = req.file;
    const filter = req.body ;

            //check in input fields is empty
            if(filter.username == '' || filter.password == ''){
                return res.status(400).json({msg: '400'}) //Fields required
            } 
            
            try {
            // Check if user exist
            const userExist = await User.findOne({username: filter.username})
            
            if(!userExist){
                return res.status(401).json({msg: '401'}) //No user found
            }
            // compare the password against what was passed from the request body
            bcrypt.compare(req.body.password, userExist.password, function(err, matches) {
                if (err){
                return res.status(403).json({msg: '403'}); // error occurred
                }
                  
                if (!matches){
                    res.status(404).json({msg: '404'}); // wrong password entered
                    //console.log('The password does NOT match!');
                }
                else {
                    let payload = { subject: userExist._id }; // subject is the key, User._id the value
                    let token = jwt.sign(payload, process.env.SECRET_LOGIN_KEY); // 'secretkey' can be anything of your choice and you can put it in .env file
                    const { password, ...others } = userExist._doc; // this will remove password from the details send to server.
                   
                    res.send({ msg: '200', token: token, userData: others})
                    //console.log('Environment data!', process.env.SECRET_KEY);
                }
               });

            } catch (err) {
            res.status(500).send({ msg: "500" });
          }
    });

  module.exports = router;