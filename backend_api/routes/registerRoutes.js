const express = require('express')
const router = express.Router()

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const multer = require("multer");
const User = require('../models/User')

const uploadLocation = "public/images"; // this is the image store location in the project
const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, uploadLocation);
  },
  filename: (req, file, callBack) => {
    var img_name = Date.now() + "." + file.mimetype.split("/")[1];
    callBack(null, img_name);
  },
});

// Multer Mime Type Validation
// this will validate the file before uploading in backend mode
//  var upload = multer({
//     storage: storage,
//     limits: {
//       fileSize: 1024 * 1024 * 5
//     },
//     fileFilter: (req, file, cb) => {
//       if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
//         cb(null, true);
//       } else {
//         cb(null, false);
//         return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
//       }
//     }
//   });

var upload = multer({ storage: storage });

// route to register user and upload profile image
router.post("/register", upload.single("file"), async (req, res, next) => {
    const file = req.file;

    //const url = req.protocol + '://' + req.get('host') // this will get the host url directly

    const filter = { _id: req.body.first_name };

    const dataReceived = { surname: req.body.surname, first_name: req.body.first_name,
    gender: req.body.gender, dob: req.body.dob, email: req.body.email, username: req.body.username,
    password: req.body.password, phone: req.body.phone, state: req.body.state, city: req.body.city,
    currency_type: req.body.currency_type, acct_type: req.body.acct_type, country: req.body.country,
    address: req.body.address };
    
    //get the object values of the request properties received
    const {surname, first_name, gender, 
        dob, email, username, password, phone, state, city, currency_type,
        acct_type, country, address, image_photo} = req.body
       
    if(!username || !password || !surname || !first_name || !gender || !dob || !email || !address ){
        return res.status(400).json({msg: '400'}) // all fields are required
    }
      try {
    // Check if user already exist
    const userExist = await User.findOne({username}).lean().exec()
    if(userExist){
        return res.status(409).json({msg: '409'}) // user already exist
    }

    // if user upload image file run this code
    if(file){
        const imageUrl = "/images/" + file.filename;
    // hash the password here
     const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
    
     // now we can destruction the variable
     const userObject = { surname, first_name, gender, dob, email, phone, state, city, currency_type,
        acct_type, username, "password": hashedPwd, country, address, "image_photo": imageUrl }
        //now let create/save the user details
            const user = await User.create(userObject)
            if(user){
                res.status(201).json({ msg: '201'}) // success message
            } else{
            res.status(401).json({ msg: '401'})  // invalid user details
            }
    }
    // if user did upload image file, run this
    else if(!file){
       // const imageUrl = "/images/" + file.filename;
    // hash the password here
     const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
    
     // now we can destruction the variable
     const userObject = { surname, first_name, gender, dob, email, phone, state, city, currency_type,
        acct_type, username, "password": hashedPwd, country, address }
        
        //console.log("details to save", dataReceived);
     
        //now let create/save the user details
            const user = await User.create(userObject)
            if(user){
                res.status(201).json({ msg: '201'}) // success message
            } else{
            res.status(401).json({ msg: '401'})  // invalid user details
            }
        }
       } catch (err) {
          res.status(500).send({ msg: "500" });
        }
  });
  
  
  // Admin route to register new user and upload profile image
router.post("/add-user", upload.single("file"), async (req, res, next) => {
    const file = req.file;

    //const url = req.protocol + '://' + req.get('host') // this will get the host url directly

    const filter = { _id: req.body.first_name };

    const dataReceived = { surname: req.body.surname, first_name: req.body.first_name,
    gender: req.body.gender, dob: req.body.dob, email: req.body.email, username: req.body.username,
    password: req.body.password, phone: req.body.phone, state: req.body.state, city: req.body.city,
    currency_type: req.body.currency_type, acct_type: req.body.acct_type, country: req.body.country,
    address: req.body.address, acct_pin: req.body.acct_pin, acct_cot: req.body.acct_cot,
    acct_imf_code: req.body.acct_imf_code, acct_tax_code: req.body.acct_tax_code,
    acct_number: req.body.acct_number };
    
    //get the object values of the request properties received
    const {surname, first_name, gender, 
        dob, email, username, password, phone, state, city, currency_type,
        acct_type, country, address, acct_pin, acct_cot, acct_imf_code,
        acct_tax_code, acct_number, image_photo} = req.body
       
    if(!username || !password || !surname || !first_name || !gender || !dob || !email || !address ){
        return res.status(400).json({msg: '400'}) // all fields are required
    }
      try {
    // Check if user already exist
    const userExist = await User.findOne({username}).lean().exec()
    if(userExist){
        return res.status(409).json({msg: '409'}) // user already exist
    }

    // if user upload image file run this code
    if(file){
        const imageUrl = "/images/" + file.filename;
    // hash the password here
     const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
    
     // now we can destruction the variable
     const userObject = { surname, first_name, gender, dob, email, phone, state, city, currency_type,
        acct_type, acct_number, acct_pin, acct_cot, acct_imf_code, acct_tax_code, username, "password": hashedPwd, "password_plain": password, country, address, "image_photo": imageUrl }
        //now let create/save the user details
            const user = await User.create(userObject)
            if(user){
                res.status(201).json({ msg: '201'}) // success message
            } else{
            res.status(401).json({ msg: '401'})  // invalid user details
            }
    }
    // if user did upload image file, run this
    else if(!file){
       // const imageUrl = "/images/" + file.filename;
    // hash the password here
     const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
    
     // now we can destruction the variable
     const userObject = { surname, first_name, gender, dob, email, phone, state, city, currency_type,
        acct_type, acct_number, acct_pin, acct_cot, acct_imf_code, acct_tax_code, username, "password": hashedPwd, "password_plain": password, country, address}
        
        //console.log("details to save", dataReceived);
     
        //now let create/save the user details
            const user = await User.create(userObject)
            if(user){
                res.status(201).json({ msg: '201'}) // success message
            } else{
            res.status(401).json({ msg: '401'})  // invalid user details
            }
        }
       } catch (err) {
          res.status(500).send({ msg: "500" });
        }
  });
  
  
  // Admin route to update user details
router.post("/update_user", upload.single("file"), async (req, res, next) => {
    const file = req.file;
    console.log(file);
    //const url = req.protocol + '://' + req.get('host') // this will get the host url directly

    const filterUser = { _id: req.body._id };

    const dataReceived = { surname: req.body.surname, first_name: req.body.first_name,
    gender: req.body.gender, dob: req.body.dob, email: req.body.email, username: req.body.username,
    password: req.body.password, phone: req.body.phone, state: req.body.state, city: req.body.city,
    currency_type: req.body.currency_type, acct_type: req.body.acct_type, country: req.body.country,
    address: req.body.address, acct_pin: req.body.acct_pin, acct_cot: req.body.acct_cot,
    acct_imf_code: req.body.acct_imf_code, acct_tax_code: req.body.acct_tax_code,
    acct_number: req.body.acct_number, _id: req.body._id, acct_status: req.body.acct_status};
    
    //get the object values of the request properties received
    const {surname, first_name, gender, 
        dob, email, username, password, phone, state, city, currency_type,
        acct_type, country, address, acct_pin, acct_cot, acct_imf_code,
        acct_tax_code, acct_number, _id, acct_status, image_photo} = req.body
       
    if(!username || !password || !surname || !first_name || !gender || !dob || !email || !address ){
        return res.status(400).json({msg: '400'}) // all fields are required
    }
      try {

    if(file){
        const imageUrl = "/images/" + file.filename;
     // now we can destruction the variable
     const userObject = { surname, first_name, gender, dob, email, phone, state, city, currency_type,
        acct_type, acct_number, acct_pin, acct_cot, acct_imf_code, acct_tax_code, username, _id, acct_status, country, address, "image_photo": imageUrl }
        const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
        //now let create/save the user details
            const updateDocBalance = {
                $set: {
                surname:req.body.surname,
                first_name: req.body.first_name, 
                gender: req.body.gender, 
                dob: req.body.dob, 
                email: req.body.email, 
                phone: req.body.phone, 
                state: req.body.state, 
                city: req.body.city, 
                currency_type: req.body.currency_type,
                acct_type: req.body.acct_type, 
                acct_number: req.body.acct_number, 
                acct_pin: req.body.acct_pin, 
                acct_cot: req.body.acct_cot, 
                acct_imf_code: req.body.acct_imf_code, 
                acct_tax_code: req.body.acct_tax_code, 
                username: req.body.username, 
                acct_status: req.body.acct_status,
                country: req.body.country, 
                address: req.body.address, 
                image_photo: imageUrl,
                password_plain: req.body.password,
                password: hashedPwd
                },
              };
            
        const updateUserNow = await User.updateOne(filterUser, updateDocBalance);
        // update user current balance here

            if(updateUserNow){
                res.status(201).json({ msg: '201'}) // success message
            console.log("Updated Details", updateUserNow.modifiedCount)
            } else{
            res.status(401).json({ msg: '401'})  // invalid user details
            }
    }
    // if user did upload image file, run this
    else if(!file){
     // now we can destruction the variable
     const userObject = { surname, first_name, gender, dob, email, phone, state, city, currency_type,
        acct_type, acct_number, acct_pin, acct_cot, acct_imf_code, acct_tax_code, username, _id, acct_status, country, address}
        const hashedPwd = await bcrypt.hash(password, 10) // salt rounds
        const updateDocBalance = {
            $set: {
            surname:req.body.surname,
            first_name: req.body.first_name, 
            gender: req.body.gender, 
            dob: req.body.dob, 
            email: req.body.email, 
            phone: req.body.phone, 
            state: req.body.state, 
            city: req.body.city, 
            currency_type: req.body.currency_type,
            acct_type: req.body.acct_type, 
            acct_number: req.body.acct_number, 
            acct_pin: req.body.acct_pin, 
            acct_cot: req.body.acct_cot, 
            acct_imf_code: req.body.acct_imf_code, 
            acct_tax_code: req.body.acct_tax_code, 
            username: req.body.username, 
            acct_status: req.body.acct_status,
            country: req.body.country, 
            address: req.body.address,
            password_plain: req.body.password,
            password: hashedPwd 
            },
          };
    const updateUserNow = await User.updateOne(filterUser, updateDocBalance);
    // update user current balance here
        if(updateUserNow){
            res.status(201).json({ msg: '201'}) // success message
        console.log("Updated Details", updateUserNow.modifiedCount)

            } else{
            res.status(401).json({ msg: '401'})  // invalid user details
            }
        }
        
       } catch (err) {
          res.status(500).send({ msg: "500" });
          console.log("Error Message", err);
        }
  });

  module.exports = router;