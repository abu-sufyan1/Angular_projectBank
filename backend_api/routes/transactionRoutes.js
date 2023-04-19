const express = require('express')
const router = express.Router()
const jwt = require("jsonwebtoken");

const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const User = require('../models/User');
const TransferFund = require('../models/fundTransfer');
const Investment = require('../models/investPlan')

const InvestorsCreditAccount = require('../models/InvestorsEarning');

const SystemActivity = require('../models/SystemActivityLogs');
const Notification = require('../models/NotificationAlert');



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
        // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.surname+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: req.body.holder_name,
        log_receiver_number: req.body.acct_number,
        log_receiver_bank: req.body.bank_name,
        log_country: '',
        log_swift_code: req.body.swift_code,
        log_desc:'Initiated wire fund transfer details',
        log_amt: req.body.send_amt,
        log_status: 'Successful',
        log_nature:'Wire transfer details',
       });

       // create notification for user 
       const userLogs = Notification.create({
        alert_username: userDetails.username,
        alert_name: userDetails.username+' '+userDetails.first_name,
        alert_user_ip: '',
        alert_country: '',
        alert_browser: '',
        alert_date:  Date.now(),
        alert_user_id: userDetails._id,
        alert_nature: 'Your wire fund transfer initiated! Complete the process for a successful wire fund transfer',
        alert_status: 1,
        alert_read_date: ''
    })
        res.status(200).send({ msg: "200", sendFund });
      }
  
      //fundsend.createdBy = (User._id); // get current user ID
    } catch (err) {
      res.status(500).send({ msg: "500" });
      console.error("Error occurred", err);
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
             // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: req.body.holder_name,
        log_receiver_number: req.body.acct_number,
        log_receiver_bank: req.body.bank_name,
        log_country: '',
        log_swift_code: req.body.swift_code,
        log_desc:'Wire fund transfer PIN Entered',
        log_amt: req.body.send_amt,
        log_status: 'Successful',
        log_nature:'PIN confirmed',
       });

        // create notification for user 
        const userLogs = Notification.create({
          alert_username: userDetails.username,
          alert_name: userDetails.username+' '+userDetails.first_name,
          alert_user_ip: '',
          alert_country: '',
          alert_browser: '',
          alert_date:  Date.now(),
          alert_user_id: userDetails._id,
          alert_nature: 'Your wire fund transfer PIN validate! Complete the process for a successful wire fund transfer',
          alert_status: 1,
          alert_read_date: ''
      })
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
             // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: req.body.holder_name,
        log_receiver_number: req.body.acct_number,
        log_receiver_bank: req.body.bank_name,
        log_country: '',
        log_swift_code: req.body.swift_code,
        log_desc:'Wire fund transfer COT details',
        log_amt: req.body.send_amt,
        log_status: 'Successful',
        log_nature:'Wire transfer COT',
       });

        // create notification for user 
        const userLogs = Notification.create({
          alert_username: userDetails.username,
          alert_name: userDetails.username+' '+userDetails.first_name,
          alert_user_ip: '',
          alert_country: '',
          alert_browser: '',
          alert_date:  Date.now(),
          alert_user_id: userDetails._id,
          alert_nature: 'Your wire fund transfer COT code validated! Complete the process for a successful wire fund transfer',
          alert_status: 1,
          alert_read_date: ''
      });
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
           // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: req.body.holder_name,
        log_receiver_number: req.body.acct_number,
        log_receiver_bank: req.body.bank_name,
        log_country: '',
        log_swift_code: req.body.swift_code,
        log_desc:'Wire fund transfer IMF Entered',
        log_amt: req.body.send_amt,
        log_status: 'Successful',
        log_nature:'Wire transfer IMF detail',
       });

        // create notification for user 
        const userLogs = Notification.create({
          alert_username: userDetails.username,
          alert_name: userDetails.username+' '+userDetails.first_name,
          alert_user_ip: '',
          alert_country: '',
          alert_browser: '',
          alert_date:  Date.now(),
          alert_user_id: userDetails._id,
          alert_nature: 'Your wire fund transfer IMF code validated! Complete the process for a successful wire fund transfer',
          alert_status: 1,
          alert_read_date: ''
      })
          res.status(201).send({ msg: "201" });
        }
     }
    } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});


router.get("/wire_fund_send/:id", async (req, res) =>{
  let recId = req.params.id;
  //console.log("Record", recId);
  try {
    const transferDetails = await TransferFund.find({tid: recId});
    //console.log(transferDetails);
     // create notification for user 
     const userLogs = Notification.create({
      alert_username: transferDetails.sender_name,
      alert_name: transferDetails.sender_name,
      alert_user_ip: '',
      alert_country: '',
      alert_browser: '',
      alert_date:  Date.now(),
      alert_user_id: transferDetails.createdBy,
      alert_nature: 'Your fund transfer successful! If you have any questions please contact support',
      alert_status: 1,
      alert_read_date: ''
  });

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
       // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: req.body.holder_name,
        log_receiver_number: req.body.acct_number,
        log_receiver_bank: req.body.bank_name,
        log_country: '',
        log_swift_code: req.body.swift_code,
        log_desc:'Initiated domestic fund transfer details',
        log_amt: req.body.send_amt,
        log_status: 'Successful',
        log_nature:'Domestic transfer details',
       });

    // create notification for user 
     const userLogs = Notification.create({
      alert_username: userDetails.username,
      alert_name: userDetails.surname+' '+userDetails.first_name,
      alert_user_ip: '',
      alert_country: '',
      alert_browser: '',
      alert_date:  Date.now(),
      alert_user_id: userDetails._id,
      alert_nature: 'Your domestic fund transfer initiated! Please complete the process for a successful transfer',
      alert_status: 1,
      alert_read_date: ''
  });
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
             // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: req.body.holder_name,
        log_receiver_number: req.body.acct_number,
        log_receiver_bank: req.body.bank_name,
        log_country: '',
        log_swift_code: req.body.swift_code,
        log_desc:'Domestic fund transfer PIN entered',
        log_amt: req.body.send_amt,
        log_status: 'Successful',
        log_nature:'Domestic transfer PIN detail',
       });

       // create notification for user 
     const userLogs = Notification.create({
      alert_username: userDetails.username,
      alert_name: userDetails.surname+' '+userDetails.first_name,
      alert_user_ip: '',
      alert_country: '',
      alert_browser: '',
      alert_date:  Date.now(),
      alert_user_id: userDetails._id,
      alert_nature: 'Your domestic fund transfer PIN validated! Please complete the process for a successful transfer',
      alert_status: 1,
      alert_read_date: ''
  })
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
      sender_name: 'Bank Credit',
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
       // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: userDetails.username+' '+ userDetails.first_name,
        log_receiver_number:userDetails.acct_number,
        log_receiver_bank: userDetails.bank_name,
        log_country: '',
        log_swift_code: '',
        log_desc:'Crediting user account details',
        log_amt: req.body.sending_amt,
        log_status: 'Successful',
        log_nature:'Admin post credit details',
       });
       // create notification for user 
     const userLogs = Notification.create({
      alert_username: userDetails.username,
      alert_name: userDetails.surname+' '+userDetails.first_name,
      alert_user_ip: '',
      alert_country: '',
      alert_browser: '',
      alert_date:  Date.now(),
      alert_user_id: userDetails._id,
      alert_nature: 'Your account has been credited! Please if you have any questions contact support',
      alert_status: 1,
      alert_read_date: ''
  })
      res.status(201).send({ msg: "201" });
    }

    //fundsend.createdBy = (User._id); // get current user ID
  } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});

// Admin debitting user account routes goes here...
router.post("/debit_user", async (req, res) => {
  let fundData = req.body;
  //console.log("User details",  req.body);
  
  const userId = req.body.debit_sender_id;
  const amt_send = req.body.debit_sending_amt;
  const filter = { _id: req.body.debit_sender_id };
  
  try {
    // let sendFund;
    let userDetails = await User.findOne({ _id: userId }); // where I am checking if user exist the I will get user details
    
    //  console.log(`${userDetails.name}`); // is showing undefine.
    let debitUserAccount = new TransferFund({
      acct_name: userDetails.surname+' ' +userDetails.first_name,
      acct_number: userDetails.acct_number,
      amount: req.body.debit_sending_amt,
      bank_name: userDetails.user_bank_name,
      sender_name: 'Bank Debit',
      tran_type: 'Debit',
      transac_nature: 'Debit',
      tran_desc: req.body.debit_note,
      createdBy: userId,
      tid: req.body.tid,
      tr_year: req.body.tr_year,
      tr_month: req.body.tr_month,
      colorcode:'red',
      sender_currency_type: userDetails.currency_type,
      sender_acct_number: userDetails.acct_number,
      transaction_status: req.body.debit_status,
      createdOn: req.body.debit_date,
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
    } 
    else if (userDetails.amount == null || userDetails.amount < amt_send ) 
    {
      res.status(401).send({ msg: "401" }); // Insufficient funds in account
    } else if (userDetails) {
       // add up amount to user current balance
       const curBalance = userDetails.amount - amt_send
       const updateDocBalance = {
        $set: {
          amount: curBalance,
          last_transaction: req.body.debit_sending_amt,
          acct_balance: curBalance,
        },
      };

      const result = await User.updateOne(filter, updateDocBalance);
     // create log here
     const addLogs = await SystemActivity.create({
      log_username: userDetails.username,
      log_name: userDetails.username+' '+ userDetails.first_name,
      log_acct_number: userDetails.acct_number,
      log_receiver_name: userDetails.username+' '+ userDetails.first_name,
      log_receiver_number:userDetails.acct_number,
      log_receiver_bank: userDetails.bank_name,
      log_country: '',
      log_swift_code: '',
      log_desc:'Debiting user account details',
      log_amt: req.body.sending_amt,
      log_status: 'Successful',
      log_nature:'Admin post debit details',
     })
      sendFund = await debitUserAccount.save();
        // create notification for user 
        const userLogs = Notification.create({
          alert_username: userDetails.username,
          alert_name: userDetails.surname+' '+userDetails.first_name,
          alert_user_ip: '',
          alert_country: '',
          alert_browser: '',
          alert_date:  Date.now(),
          alert_user_id: userDetails._id,
          alert_nature: 'Your account has been debited! Please if you have any questions contact support',
          alert_status: 1,
          alert_read_date: ''
      })
      res.status(201).send({ msg: "201" });
    }

    //fundsend.createdBy = (User._id); // get current user ID
  } catch (err) {
    res.status(500).send({ msg: "500" });
  }
});


// Admin crediting investors account routes goes here...
router.post("/credit_investors", async (req, res) => {
  let fundData = req.body;
  //console.log("User details",  req.body);
  
  const userId = req.body.credit_receiver_id;
  const amt_send = req.body.sending_amt;
  const filter = { _id: req.body.credit_receiver_id };
  
  try {
    // let sendFund;
    let userDetails = await User.findOne({ _id: userId }); // where I am checking if user exist the I will get user details
    let investDetails = await Investment.findOne({ _id: req.body.credit_record_id})
    //console.log(`${userDetails.surname}`); // is showing undefine.
    if (!userDetails) {
      res.status(402).send({ msg: "402" });
      //console.log("User not fund!"); // user account not found then show error
    } else if (
      userDetails.acct_status == "Pending" ||
      userDetails.acct_status == null
    ) {
      res.status(403).send({ msg: "403" });
      // user account status is not active
    } 
    else if (investDetails.invest_status !="Approved") {
      return res.status(401).send({ msg: "401" });
    }
    else if (userDetails) {
      let creditUserAccount = new InvestorsCreditAccount({
        receiver_name: userDetails.surname+' ' +userDetails.first_name,
        receiver_email: userDetails.email,
        plan_type: req.body.invest_type,
        investment_name: req.body.invest_plan,
        investment_duration: '',
        investment_notes: req.body.credit_note,
        transaction_type: 'Credit',
        roi_amt: req.body.sending_amt,
        credit_status: 'Successful',
        receiver_id: req.body.credit_receiver_id,
        investment_id: req.body.credit_record_id,
        addedBy:req.body.sender_id,
        tid: req.body.tid,
        post_date: req.body.credit_date
        });
       // add up amount to user current balance
      //  const curBalance = userDetails.amount+ +amt_send
      //  const updateDocBalance = {
      //   $set: {
      //     amount: curBalance,
      //     last_transaction: req.body.sending_amt,
      //     acct_balance: curBalance,
      //   },
      // };

      // const result = await User.updateOne(filter, updateDocBalance);
     
      sendFund = await creditUserAccount.save();
        // create log here
       const addLogs = await SystemActivity.create({
        log_username: userDetails.username,
        log_name: userDetails.username+' '+ userDetails.first_name,
        log_acct_number: userDetails.acct_number,
        log_receiver_name: userDetails.username+' '+ userDetails.first_name,
        log_receiver_number:userDetails.acct_number,
        log_receiver_bank: userDetails.bank_name,
        log_country: '',
        log_swift_code: '',
        log_desc:'Crediting user investment account details',
        log_amt: req.body.sending_amt,
        log_status: 'Successful',
        log_nature:'Admin post credit details',
       });
          // create notification for user 
     const userLogs = Notification.create({
      alert_username: userDetails.username,
      alert_name: userDetails.surname+' '+userDetails.first_name,
      alert_user_ip: '',
      alert_country: '',
      alert_browser: '',
      alert_date:  Date.now(),
      alert_user_id: userDetails._id,
      alert_nature: 'Your have receive ROI of your investment been credited! Please if you have any questions contact support',
      alert_status: 1,
      alert_read_date: ''
  })
      res.status(201).send({ msg: "201" });
    }

    //fundsend.createdBy = (User._id); // get current user ID
  } catch (err) {
    res.status(500).send({ msg: "500" });
    console.log(err);
  }
});

  module.exports = router;