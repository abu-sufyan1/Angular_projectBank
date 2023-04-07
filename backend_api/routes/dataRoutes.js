const express = require('express')
const router = express.Router()
const jwt = require("jsonwebtoken");

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const User = require('../models/User');
const TransferFund = require('../models/FundTransfer');
const Officer = require('../models/accountOfficer');
const Ticket = require('../models/ticketData');


// route to get logged in user profile details
// get current user account details/profile here..
router.get("/profile/:id", async (req, res) => {
    let userId = req.params.id;
    try {
      const userDetails = await User.findOne({ _id: userId });
     //   const userTransacSuccess = await TransferFund.aggregate([
    //     { $match: { createdBy: userId } },
    //     {
    //       $group: {
    //         _id: "$transaction_status",
    //         totalAmount: { $sum: "$amount" },
    //       },
    //     },
    //   ]);
  
      const { password, ...others } = userDetails._doc; // this will remove password from the details send to server.
  
      res.status(200).send({ others });
    } catch (err) {
      res.status(500).json(err.message);
      console.log(err.message);
    }
  });
  
  // get current user financial details here..
  router.get("/income_details/:id", async (req, res) => {
    let userId = req.params.id;
    try {
      const userTransacPending = await TransferFund.aggregate([
        { $match: { createdBy: userId } },
        { $sort: { amount: -1 } },
        { $group: { _id: "$transac_nature", totalAmount: { $sum: "$amount" } } },
      ]);
      res.status(200).send(userTransacPending);
    } catch (err) {
      res.status(500).json(err.message);
      console.log(err.message);
    }
  });

  // get recent transaction of the user financial details here..
  router.get("/recent_transactions/:id", async (req, res) => {
    let userId = req.params.id;
    try {
      const recentTransaction = await TransferFund.find({createdBy: userId})
      .sort({ createdOn: -1 }).limit(5);
      res.status(200).send(recentTransaction);
    } catch (err) {
      res.status(500).json(err.message);
      console.log(err.message);
    }
  });

  // get account history statement here..
router.get("/history-wallet/:id", async (req, res) => {
    let userId = req.params.id;
    //console.log(userId);
    try {
      const walletStatement = await TransferFund.find({ createdBy: userId })
        .sort({ createdOn: -1 })
        .limit(5);
      //const totalItems =  await TransferFund.countDocuments()
      res.status(200).send(walletStatement);
      //console.log(walletStatement);
    } catch (err) {
      res.status(500).json(err);
      console.log(err.message);
    }
  });

// get user account statement financial record here..
router.get("/user_acct_statement", async (req, res) => {
  const page = req.query.page;
  const userId = req.query.id;
  console.log("my ID", userId);
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const accountStatement = await TransferFund.find({createdBy: userId})
    .sort({ createdOn: -1 }).limit(50)
    .skip(skip);
    const totalItems = await TransferFund.countDocuments();
    res.status(200).send({data: accountStatement, total_record: totalItems});
  } catch (err) {
    res.status(500).json(err.message);
    console.log(err.message);
  }
});
// get user account statement financial record here..
router.get("/user_acct_summary/:id", async (req, res) => {
  let userId = req.params.id;
  //console.log("My ID", userId);
  try {
    const userTransacPending = await TransferFund.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: "$transac_nature", totalAmount: { $sum: "$amount" } } },
    ]);
    res.status(200).send(userTransacPending);
  } catch (err) {
    res.status(500).json(err.message);
    console.log(err.message);
  }
});

// get user account history record here..
router.get("/user_tran_history", async (req, res) => {
  const page = req.query.page;
  const userId = req.query.id;
  console.log("my ID", userId);
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  //console.log(limit, page);
  try {
    const acctStatement = await TransferFund.find({ createdBy: userId })
      .sort({ createdOn: -1 })
      .skip(skip);
    const totalItems = await TransferFund.countDocuments();
    res.status(200).send({ data: acctStatement, total_record: totalItems });
    // console.log(acctStatement, totalItems);
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});


// user request route to block their account goes here...
router.post("/block_user_acct", async (req, res) => {
  const userId = req.body;
  console.log("My Blocked ID: ", req.body)
  // get the transfer record ID here
  const filter = { _id: userId.block_id };
      if (userId == "" || userId == null) {
       return res.status(401).send({ msg: "401" }); // cot code required
      }
  try {
        let userDetails = await User.findOne({ _id:  userId.block_id }); // here I am checking if user exist then I will get user details
        if (!userDetails) {
          //console.log("User details: ", userDetails)
          res.status(404).send({ msg: '404' }); // user not found
        } 
        else if (userDetails){
      // update user account status to blocked
          const updateDoc = {
            $set: {
              acct_status: "Blocked",
              },
          };
           const result = await User.updateOne(filter, updateDoc);
            console.log("User details: ", result)
            // check if the record has been updated
            if(result.modifiedCount > 0) {
              res.status(201).send({ msg: "201" });
            }
            else {
              res.status(403).send({ msg: "403" });
            }
        }
    } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});

// get account officer details/profile here..
router.get("/officer_details", async (req, res) => {
  try {
    const officerDetails = await Officer.find();
    if (!officerDetails) {
      console.log("ERROR :: No record found");
      res.status(404).send({ msg: "404" });
      // student record failed to create
    } else {
      res.status(200).send({data: officerDetails});
      //console.log("Data :: found", officerDetails);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});
  
// get account officer details/profile here..
router.post("/add_officer", async (req, res) => {
    //console.log("Backend Data", req.body)

    try {
      let officerUsername = await Officer.findOne({ username:  req.body.username }); // here I am checking if user exist then I will get user details
      if (officerUsername) {
        //console.log("User details: ", userDetails)
        res.status(404).send({ msg: '404' }); // username exists
      } 
      else if (!officerUsername){
    
        const user = await Officer.create(req.body)
        res.status(200).send({ msg: "200" });
     }
  } catch (err) {
  res.status(500).send({ msg: "500" });
}

});

// get account officer details/profile here..
router.post("/submit_ticket", async (req, res) => {
    console.log("Backend Data", req.body)

    try {
      let checkUser = await User.findOne({ _id:  req.body.createdBy }); // here I am checking if user exist then I will get user details
      if (!checkUser) {
        //console.log("User details: ", userDetails)
        return res.status(404).send({ msg: '404' }); // user not exists
      } 
      else if (checkUser){
    
        const sumbitTicket = await Ticket.create(req.body)
        res.status(200).send({ msg: "200" });
     }
  } catch (err) {
  res.status(500).send({ msg: "500" });
}

});

  module.exports = router;