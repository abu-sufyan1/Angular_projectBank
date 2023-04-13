const express = require('express')
const router = express.Router()
const jwt = require("jsonwebtoken");

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const User = require('../models/User');
const TransferFund = require('../models/fundTransfer');


// all transaction routes goes here...


// wire transfer routes goes here...
router.post("/wire_transfer_funds", async (req, res) => {
    let fundData = req.body;
    //console.log("User details",  req.body);
    
    const userId = req.body.createdBy;
    const amt_send = req.body.send_amt;
    
    try {
      // let sendFund;
      let userDetails = await User.findOne({ _id: userId }); // where I am checking if user exist the I will get user details
      //  console.log(`${userDetails.name}`); // is showing undefine.
      let fundsend = new TransferFund({
        acct_name: req.body.holder_name,
        acct_number: req.body.acct_number,
        swift_code: req.body.swift_code,
        amount: req.body.send_amt,
        bank_name: req.body.bank_name,
        bank_address: req.body.address,
        sender_name: userDetails.surname+' '+userDetails.first_name,
        tran_type: 'Transfer',
        transac_nature: 'Debit',
        tran_desc: 'Wire bank transfer',
        createdBy: userId,
        tid: req.body.tid,
        tr_year: req.body.tr_year,
        tr_month: req.body.tr_month,
        sender_currency_type: userDetails.currency_type,
        sender_acct_number: userDetails.acct_number,
        colorcode: 'red',
    });
      if (!userDetails) {
        res.status(402).send({ msg: "402" });
        //console.log("User not fund!"); // user account not found then show error
      } else if (
        userDetails.acct_status == "Pending" ||
        userDetails.acct_status == null
      ) {
        res.status(403).send({ msg: "403" });
        // user account status is not active
      } else if (userDetails.amount == "" || userDetails.amount < amt_send) {
        res.status(405).send({ msg: "405" }); // user account balance is low
      } else if (userDetails) {
        sendFund = await fundsend.save();
        res.status(200).send({ msg: "200", sendFund });
      }
  
      //fundsend.createdBy = (User._id); // get current user ID
    } catch (err) {
      res.status(500).send({ msg: "500" });
    }
  }); 
  
  // wire transfer pin confirm routes goes here...
router.post("/confirm_pin", async (req, res, next) => {
    const userId = req.body.createdBy;
    console.log("PIN: ", req.body.createdBy)
    // get the transfer record ID here
    const filter = { tid: req.body.tran_id };
    try {
      if (req.body.pin_code == "" || req.body.pin_code == null) {
       return res.status(404).send({ msg: "404" }); // cot code required
       }
     
       let userDetails = await User.findOne({ _id: userId }); // here I am checking if user exist then I will get user details
     
       if (!userDetails) {
        res.status(402).send({ msg: '402' });
      } 
      else if (userDetails){

       if (userDetails.acct_pin == "" || userDetails.acct_pin == null) {
          res.status(403).json({ msg: "403" }); // user account pin not found
          //console.log("Pin empty: ", res.status)
        }
        else if (userDetails.acct_pin != req.body.pin_code) {
          res.status(406).send({ msg: "406" }); // invalid pin entered
        } 
        else if (userDetails.acct_status !== 'Active' || userDetails.acct_status == null) {
          res.status(401).send({ msg: "401" }); // account is blocked
        } 
        else if (userDetails.acct_pin == req.body.pin_code) {
            //update single record transfer status collection here
            //console.log("Pin was found: ", res)
            const updateDoc = {
              $set: {
                transaction_status: "Pin validated",
              },
            }
            const result = await TransferFund.updateOne(filter, updateDoc);
            res.status(201).send({ msg: "201" });
          }
       }
      
      } catch (err) {
      res.status(500).send({ msg: "500" });
    }
  });
  
  // wire transfer cot code confirm routes goes here...
router.post("/cot_confirm", async (req, res) => {
    let fundData = req.body;
    const userId = req.body.createdBy;
    //console.log("PIN: ", req.body.createdBy)
    // get the transfer record ID here
    const filter = { tid: req.body.tran_id };
    try {
      if (req.body.cot_code == "" || req.body.cot_code == null) {
       return res.status(404).send({ msg: "404" }); // cot code required
       }
      let userDetails = await User.findOne({ _id: userId }); // here I am checking if user exist then I will get user details
       if (!userDetails) {
        res.status(402).send({ msg: '402' });
      } 
      else if (userDetails){
       if (userDetails.acct_cot == "" || userDetails.acct_cot == null) {
          res.status(403).json({ msg: "403" }); // cot code required
          //console.log("Pin empty: ", res.status)
        }
        else if (userDetails.acct_cot != req.body.cot_code) {
          res.status(406).send({ msg: "406" }); // invalid cot code entered
        } 
        else if (userDetails.acct_status !== 'Active' || userDetails.acct_status == null) {
          res.status(401).send({ msg: "401" }); // account is blocked
        } 
        else if (userDetails.acct_cot == req.body.cot_code) {
            //update single record transfer status collection here
             const updateDoc = {
              $set: {
                transaction_status: "COT Code Validated",
              },
            }
            const result = await TransferFund.updateOne(filter, updateDoc);
            res.status(201).send({ msg: "201" });
          }
       }
      } catch (err) {
      res.status(500).send({ msg: "500" });
    }
  });

  // wire transfer IMF code confirm routes goes here...
router.post("/imf_confirm", async (req, res) => {
  const userId = req.body.createdBy;
  //console.log("PIN: ", req.body.createdBy)
  // get the transfer record ID here
  const filter = { tid: req.body.tran_id };
  try {
    const filterUser = { _id: req.body.createdBy }; // get current user ID here from request send

    if (req.body.imf_code == "" || req.body.imf_code == null) {
     return res.status(404).send({ msg: "404" }); // imf code required
     }
     let tranAmount = await TransferFund.findOne({ tid: req.body.tran_id }); // get the amount transfer from transfer table
     let userDetails = await User.findOne({ _id: userId }); // here I am checking if user exist then I will get user details
     
    const curBalance = userDetails.amount - tranAmount.amount; // remove amount send from user current balance
    
    if (!userDetails) {
      res.status(402).send({ msg: '402' });
    } 
    else if (userDetails){
     if (userDetails.acct_imf_code == "" || userDetails.acct_imf_code == null) {
        res.status(403).json({ msg: "403" }); // imf code not active
        //console.log("Pin empty: ", res.status)
      }
      else if (userDetails.acct_imf_code != req.body.imf_code) {
        res.status(406).send({ msg: "406" }); // invalid cot code entered
      } 
      else if (userDetails.acct_status !== 'Active' || userDetails.acct_status == null) {
        res.status(401).send({ msg: "401" }); // account is blocked
      } 
      else if (userDetails.acct_imf_code == req.body.imf_code) {
          
         // update transfer status table to be successful
          const updateDoc = {
            $set: {
              transaction_status: "Successful",
              tran_type: "Transfer",
              transac_nature: "Debit",
              tran_desc: "Wire Fund transfer",
              trans_balance: curBalance,
            },
          };
        
          const result = await TransferFund.updateOne(filter, updateDoc);
          // update user current balance here
            const updateDocBalance = {
              $set: {
                amount: curBalance,
                last_transaction: tranAmount.amount,
              },
            };

          const result_bal = await User.updateOne(filterUser, updateDocBalance);
          res.status(201).send({ msg: "201" });
        }
     }
    } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});


router.get("/wire_fund_send/:id", async (req, res) =>{
  let recId = req.params.id;
  console.log("Record", recId);
  try {
    const transferDetails = await TransferFund.find({tid: recId});
    //console.log(transferDetails);
    res.status(200).send(transferDetails);
  } catch (err) {
    res.status(500).json(err.message);
    console.log(err.message);
  }
})


 // domestic fund transfer routes goes here...
 router.post("/domestic_fund_send", async (req, res) => {
  let fundData = req.body;
  //console.log("User details",  req.body);
  
  const userId = req.body.createdBy;
  const amt_send = req.body.send_amt;
  
  try {
    // let sendFund;
    let userDetails = await User.findOne({ _id: userId }); // where I am checking if user exist the I will get user details
    //  console.log(`${userDetails.name}`); // is showing undefine.
    let fundsend = new TransferFund({
      acct_name: req.body.holder_name,
      acct_number: req.body.acct_number,
      swift_code: req.body.swift_code,
      amount: req.body.send_amt,
      bank_name: req.body.bank_name,
      bank_address: req.body.address,
      sender_name: userDetails.surname+' '+userDetails.first_name,
      tran_type: 'Transfer',
      transac_nature: 'Debit',
      tran_desc: 'Domestic bank transfer',
      createdBy: userId,
      tid: req.body.tid,
      tr_year: req.body.tr_year,
      tr_month: req.body.tr_month,
      colorcode:'red',
      sender_currency_type: userDetails.currency_type,
      sender_acct_number: userDetails.acct_number,
  });
    if (!userDetails) {
      res.status(402).send({ msg: "402" });
      //console.log("User not fund!"); // user account not found then show error
    } else if (
      userDetails.acct_status == "Pending" ||
      userDetails.acct_status == null
    ) {
      res.status(403).send({ msg: "403" });
      // user account status is not active
    } else if (userDetails.amount == "" || userDetails.amount < amt_send) {
      res.status(405).send({ msg: "405" }); // user account balance is low
    } else if (userDetails) {
      sendFund = await fundsend.save();
      res.status(200).send({ msg: "200", sendFund });
    }

    //fundsend.createdBy = (User._id); // get current user ID
  } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});

// domestic transfer pin confirm routes goes here...
router.post("/domestic_pin", async (req, res, next) => {
  const userId = req.body.createdBy;
  console.log("PIN: ", req.body.createdBy)
  // get the transfer record ID here
  const filter = { tid: req.body.tran_id };
  try {
    if (req.body.pin_code == "" || req.body.pin_code == null) {
     return res.status(404).send({ msg: "404" }); // cot code required
     }
   
     let tranAmount = await TransferFund.findOne({ tid: req.body.tran_id }); // get the amount transfer from transfer table
     let userDetails = await User.findOne({ _id: userId }); // here I am checking if user exist then I will get user details
     
     const curBalance = userDetails.amount - tranAmount.amount; // remove amount send from user current balance

     if (!userDetails) {
      res.status(402).send({ msg: '402' });
    } 
    else if (userDetails){

     if (userDetails.acct_pin == "" || userDetails.acct_pin == null) {
        res.status(403).json({ msg: "403" }); // user account pin not found
        //console.log("Pin empty: ", res.status)
      }
      else if (userDetails.acct_pin != req.body.pin_code) {
        res.status(406).send({ msg: "406" }); // invalid pin entered
      } 
      else if (userDetails.acct_status !== 'Active' || userDetails.acct_status == null) {
        res.status(401).send({ msg: "401" }); // account is blocked
      } 
      else if (userDetails.acct_pin == req.body.pin_code) {
          //update single record transfer status collection here
          //console.log("Pin was found: ", res)
         
          // update transfer status table to be successful
          const updateDoc = {
            $set: {
              transaction_status: "Successful",
              tran_type: "Transfer",
              transac_nature: "Debit",
              tran_desc: "Domestic Fund transfer",
              trans_balance: curBalance,
            },
          };
        
          const result = await TransferFund.updateOne(filter, updateDoc);
          // update user current balance here
            const updateDocBalance = {
              $set: {
                amount: curBalance,
                last_transaction: tranAmount.amount,
              },
            };
          res.status(201).send({ msg: "201" });
        }
     }
    
    } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});


// Admin crediting user account routes goes here...
router.post("/credit_user", async (req, res) => {
  let fundData = req.body;
  //console.log("User details",  req.body);
  
  const userId = req.body.credit_sender_id;
  const amt_send = req.body.sending_amt;
  const filter = { _id: req.body.credit_sender_id };
  
  try {
    // let sendFund;
    let userDetails = await User.findOne({ _id: userId }); // where I am checking if user exist the I will get user details
    
    //  console.log(`${userDetails.name}`); // is showing undefine.
    let creditUserAccount = new TransferFund({
      acct_name: userDetails.surname+' ' +userDetails.first_name,
      acct_number: userDetails.acct_number,
      amount: req.body.sending_amt,
      bank_name: userDetails.user_bank_name,
      tran_type: 'Credit',
      transac_nature: 'Credit',
      tran_desc: req.body.credit_note,
      createdBy: userId,
      tid: req.body.tid,
      tr_year: req.body.tr_year,
      tr_month: req.body.tr_month,
      colorcode:'green',
      sender_currency_type: userDetails.currency_type,
      sender_acct_number: userDetails.acct_number,
      transaction_status: req.body.credit_status,
      createdOn: req.body.credit_date,
  });
    if (!userDetails) {
      res.status(402).send({ msg: "402" });
      //console.log("User not fund!"); // user account not found then show error
    } else if (
      userDetails.acct_status == "Pending" ||
      userDetails.acct_status == null
    ) {
      res.status(403).send({ msg: "403" });
      // user account status is not active
    } else if (userDetails) {
       // add up amount to user current balance
       const curBalance = userDetails.amount+ +amt_send
       const updateDocBalance = {
        $set: {
          amount: curBalance,
          last_transaction: req.body.sending_amt,
          acct_balance: curBalance,
        },
      };

      const result = await User.updateOne(filter, updateDocBalance);
     
      sendFund = await creditUserAccount.save();

      res.status(201).send({ msg: "201" });
    }

    //fundsend.createdBy = (User._id); // get current user ID
  } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});

  module.exports = router;