const express = require('express')
const router = express.Router()
const jwt = require("jsonwebtoken");

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const User = require('../models/User');
const SystemActivity = require('../models/SystemActivityLogs');
const SystemLogs = require('../models/UserLogs')


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
                      // create log here
                const addLogs = SystemActivity.create({
                    log_username: userExist.username,
                    log_name: userExist.surname+' '+userExist.first_name,
                    log_acct_number: userExist.acct_number,
                    log_receiver_name: '',
                    log_receiver_number: '',
                    log_receiver_bank: '',
                    log_country: '',
                    log_swift_code: '',
                    log_desc:'Account login successfully',
                    log_amt: '',
                    log_status: 'Successful',
                    log_nature:'User login',
                })

                // user logs status here.
                const userLogs = SystemLogs.create({
                    login_username: userExist.username,
                    login_name: userExist.surname + ' ' + userExist.first_name,
                    login_user_ip: '',
                    login_country: '',
                    login_browser: '',
                    login_date:  Date.now(),
                    user_log_id: userExist._id,
                    logout_date: '',
                    login_nature: 'User logged in',
                    login_status: 1
                })
                    res.send({ msg: '200', token: token, userData: others})
                    //console.log('Environment data!', process.env.SECRET_KEY);
                }
               });

            } catch (err) {
            res.status(500).send({ msg: "500" });
          }
    });
    
    // route to register user and upload profile image
router.get("/user_logout/:id", async (req, res, next) => {
    let myId = req.params.id;

    var today = new Date();
    var month = today.toLocaleString('default', { month: 'long' });
        
       // console.log("User ID", req.params.id);
        try {
            const userData = await User.find({_id: req.params.id });
            const userLogs = await SystemLogs.find({user_log_id: req.params.id });
            //console.log("User log Details ", userLogs)
            const filter = { user_log_id: req.params.id, login_status: 1 };
            if(!userLogs) {
            res.status(404).json({ msg: '404' })
            }
            else if(userLogs){
            const addLogs = SystemActivity.create({
                log_username: userData.username,
                log_name: userData.surname+' '+userData.first_name,
                log_acct_number: userData.acct_number,
                log_receiver_name: '',
                log_receiver_number: '',
                log_receiver_bank: '',
                log_country: '',
                log_swift_code: '',
                log_desc:'Account logout successfully',
                log_amt: '',
                log_status: 'Successful',
                log_nature:'User logout',
            });
            // update user logs details
                const updateDoc = {
                    $set: {
                      login_status: 0,
                      logout_date: Date.now(),
                      login_nature: "Logout"
                     },
                  }
            const result = await SystemLogs.updateMany(filter, updateDoc);
            //console.log("Result Details", result);
            res.status(200).send({msg: '200'});
            }
        } catch (err) {
            res.status(500).json(err);
            console.log(err.message);
        }
    });

  module.exports = router;