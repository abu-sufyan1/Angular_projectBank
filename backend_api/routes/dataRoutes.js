const express = require('express');
const router = express.Router()
const jwt = require("jsonwebtoken");

const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const multer = require("multer");


const User = require('../models/User');
const TransferFund = require('../models/fundTransfer');
const Officer = require('../models/accountOfficer');
const Ticket = require('../models/ticketData');
const Investment = require('../models/investPlan');
const AngroPlan = require('../models/AgroInvestPlans')
const StockPlan = require('../models/StockInvestPlans')
const FXPlan = require('../models/FxInvestPlans')
const InvestorEarnings = require('../models/InvestorsEarning')
const UserLog = require('../models/UserLogs')
const UserSystemLog = require('../models/SystemActivityLogs')


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

var upload = multer({ storage: storage });
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

// process invest plan request details here..
router.post("/submit_investment", async (req, res) => {
  //sconsole.log("Backend Data", req.body)
 // res.status(200).send({ msg: "200" });
      try {
        let checkUser = await Investment.findOne({ createdBy:  req.body.createdBy }); // here I am checking if user exist then I will get user details
        if (checkUser) {
          //console.log("User details: ", userDetails)
          return res.status(401).send({ msg: '401' }); // Investment is already running
        } 
        else if (!checkUser){
      
          const sumbitTicket = await Investment.create(req.body)
          res.status(200).send({ msg: "200" });
      }
      // const sumbitTicket = await Investment.create(req.body)
      //  res.status(200).send({ msg: "200" });
    } catch (err) {
      res.status(500).send({ msg: "500" });
    }

  });

  // get finance charts details here..
router.get("/user_finance_chart/:id", async (req, res) => {
  let myId = req.params.id;
  
  //console.log("User ID", req.params.id);
  // Getting full month name (e.g. "June")
  var today = new Date();
  var month = today.toLocaleString('default', { month: 'long' });
  
  //console.log("today Month", month);
  try {
    const chartStatement = await TransferFund.find({createdBy: myId })
    .sort({ createdOn: -1 });

    // const chartStatement = await TransferFund. aggregate([
    //   { $match: { createdBy: myId } },
    //   { $group: { tr_year: "$tr_year" } },
    // ]);

   
    //console.log("Chart Details ", chartStatement)
    res.status(200).send(chartStatement);
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// admin request routes goes here

// get all users details/profile here..
router.get("/all-users", async (req, res) => {
  try {
    const userDetails = await User.find().select('-password');
    
    if (!userDetails) {
      console.log("ERROR :: No record found");
      res.status(404).send({ msg: "404" });
      // student record failed to create
    } else {
      res.status(200).send({data: userDetails});
      //console.log("Data :: found", officerDetails);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all admin users details/profile here..
router.get("/admin_users", async (req, res) => {
  try {
    const adminUserDetails = await User.find({user_role: 'Admin'}).select('-password');
    if(adminUserDetails){
      res.status(200).send({data: adminUserDetails});
    }
    else{  
    }
    } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all active users details/profile here..
router.get("/active-users", async (req, res) => {
  try {
    const activeUserDetails = await User.find({acct_status: 'Active'});
    //pending user goes here
    const pendingUserDetails = await User.find({acct_status: 'Pending'});
    //blocked users goes here
    const blockedUserDetails = await User.find({acct_status: 'Blocked'});
    if (!activeUserDetails) {
      console.log("ERROR :: No record found");
      res.status(404).send({ msg: "404" });
      // student record failed to create
    } else {
      res.status(200).send({data: activeUserDetails, 
        blocked: blockedUserDetails, pending: pendingUserDetails});
     // console.log("Data :: found", activeUserDetails);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all active users details/profile here..
router.get("/users-transactions", async (req, res) => {
  try {
    const UserTransaction = await TransferFund.find();
    const limitUserTransaction = await TransferFund.find().sort({_id: -1}).limit(5);
    if (!UserTransaction) {
      console.log("ERROR :: No record found");
      res.status(404).send({ msg: "404" });
      // student record failed to create
    } else {
      res.status(200).send({data: UserTransaction, recent: limitUserTransaction});
      //console.log("Data :: found", UserTransaction);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all users investment details here..
router.get("/users-investments", async (req, res) => {
  try {
    const UserInvestment = await Investment.find();
    if (!UserInvestment) {
      console.log("ERROR :: No record found");
      res.status(404).send({ msg: "404" });
      // student record failed to create
    } else {
      res.status(200).send({data: UserInvestment});
      //console.log("Data :: found", UserTransaction);
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all users details with pagination here..
router.get("/user-details", async (req, res) => {
  const page = req.query.page;
  const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const allUsers = await User.find({user_role: "User"}).sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    
    const totalItems = await User.countDocuments();
    res.status(200).send({ data: allUsers, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all pending users details with pagination here..
router.get("/pending_users", async (req, res) => {
  const page = req.query.page;
  //const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const allUsers = await User.find({acct_status: 'Pending'}).sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    //console.log("result Data", allUsers)
    const totalItems = await User.countDocuments();
    res.status(200).send({ data: allUsers, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all users transaction details with pagination here..
router.get("/user_tran", async (req, res) => {
  const page = req.query.page;
  //const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const allTrans = await TransferFund.find().sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    
    const totalItems = await TransferFund.countDocuments();
    res.status(200).send({ data: allTrans, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

 // fetch user details to show in the edit form here..
 router.get("/fetch_edit_user/:id", async (req, res) => {
  let myId = req.params.id;
  
  //console.log("Edit User ID", req.params.id);
  // Getting full month name (e.g. "June")
  var today = new Date();
  var month = today.toLocaleString('default', { month: 'long' });
  
  //console.log("today Month", month);
  try {
    const userData = await User.find({_id: myId });
    //console.log("Chart Details ", chartStatement)
    res.status(200).send({data:userData});
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// delete user details here..
 router.delete("/delete_user_details/:id", async (req, res) => {
  let myId = req.params.id;
  //console.log("Delete ID", req.params.id);
   try {
    // find record by the post ID
    const query = await User.findOne({_id: req.params.id});
    //console.log("User Details", query);
    if(!query || query==null) {
     return res.status(403).send({ msg: "403" }); // No ID found
    }
    // delete the record found here
    const result = await User.deleteOne(query);

    if (result.deletedCount ===1) {
      res.status(200).send({ msg: "200" });
      //console.log("User delete Details", deleteUser )
    } else {
      res.status(404).send({ msg: "404" });
      console.log("No record deleted.");
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// delete user details here..
 router.delete("/delete_transactions/:id", async (req, res) => {
  let myId = req.params.id;
  //console.log("Delete ID", req.params.id);
   try {
    // find record by the post ID
    const query = await TransferFund.findOne({_id: req.params.id});
    //console.log("User Details", query);
    //console.log("User Details", query);
    if(!query || query==null) {
      return res.status(403).send({ msg: "403" }); // No ID found
    }
    // delete the record found here
    const deleteRecord = await TransferFund.deleteOne(query);

    if (deleteRecord.deletedCount === 1) {
      res.status(200).send({ msg: "200" });
    } else {
      res.status(404).send({ msg: "404" });
      console.log("No documents matched the query id.");
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// update angro plan investment details here..
router.post("/update_angro_invest", async (req, res) => {

  //console.log("body data", req.body);
  try {

    
    const checkUser = await AngroPlan.find().count(); // here I am checking if user exist then I will get user details
        //console.log("database data ", checkUser)
    
    if (checkUser != 0) {
      const updateDoc = {
        $set: {
          starter_plan: req.body.starter_amt,
          premier_plan: req.body.premier_amt,
          gold_plan: req.body.gold_amt,
        },
      }
      const result = await AngroPlan.updateOne(updateDoc);
     return res.status(200).send({msg: "200"});
          //console.log("User details: ", checkUser)
          //return res.status(404).send({ msg: '404' }); // Investment is already running
        }
    else if(checkUser == null || checkUser == undefined || checkUser == 0) {
    const sumbitTicket = await AngroPlan.create({
      starter_plan: req.body.starter_amt,
      premier_plan: req.body.premier_amt,
      gold_plan: req.body.gold_amt,
    })
    saveRecord = await sumbitTicket.save();
    res.status(200).send({msg: "200"});
  }
    
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// update stock plan investment details here..
router.post("/update_stock_invest", async (req, res) => {
 try {
    const checkUser = await StockPlan.find().count(); // here I am checking if user exist then I will get user details
     if (checkUser != 0) {
      const updateDoc = {
        $set: {
          starter_plan: req.body.starter_amt,
          premier_plan: req.body.premier_amt,
          gold_plan: req.body.gold_amt,
        },
      }
      const result = await StockPlan.updateOne(updateDoc);
     return res.status(200).send({msg: "200"});
      }
    else if(checkUser == null || checkUser == undefined || checkUser == 0) {
    const sumbitTicket = await StockPlan.create({
      starter_plan: req.body.starter_amt,
      premier_plan: req.body.premier_amt,
      gold_plan: req.body.gold_amt,
    })
    saveRecord = await sumbitTicket.save();
    res.status(200).send({msg: "200"});
  }
    
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// update fx plan investment details here..
router.post("/update_fx_invest", async (req, res) => {
 try {
    const checkUser = await FXPlan.find().count(); // here I am checking if user exist then I will get user details
     if (checkUser != 0) {
      const updateDoc = {
        $set: {
          starter_plan: req.body.starter_amt,
          premier_plan: req.body.premier_amt,
          gold_plan: req.body.gold_amt,
        },
      }
      const result = await FXPlan.updateOne(updateDoc);
     return res.status(200).send({msg: "200"});
      }
    else if(checkUser == null || checkUser == undefined || checkUser == 0) {
    const sumbitTicket = await FXPlan.create({
      starter_plan: req.body.starter_amt,
      premier_plan: req.body.premier_amt,
      gold_plan: req.body.gold_amt,
    })
    saveRecord = await sumbitTicket.save();
    res.status(200).send({msg: "200"});
  }
    
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all investment plan investment by admin here..
router.get("/all_invest_plan", async (req, res) => {
 try {
      const get_fxPlans = await FXPlan.find(); // here I am checking if user exist then I will get user details
     
      const get_angPlan = await AngroPlan.find();

      const get_stockPlan = await StockPlan.find();

      res.status(200).send({"fx_data": get_fxPlans, "angro_data": get_angPlan, "stock_data": get_stockPlan});
     
      } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all investors details with pagination here..
router.get("/all_investors", async (req, res) => {
  const page = req.query.page;
  //const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const allInvestors = await Investment.find().sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    
    const totalItems = await Investment.countDocuments();
    res.status(200).send({ data: allInvestors, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all investors earning details with pagination here..
router.get("/investors_earnings", async (req, res) => {
  const page = req.query.page;
  //const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const allInvestors = await InvestorEarnings.find().sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    
    const totalItems = await InvestorEarnings.countDocuments();
    res.status(200).send({ data: allInvestors, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get investment analysis details/profile here..
router.get("/investors_analysis", async (req, res) => {
  try {
    const angorUsersDetails = await Investment.find({investment_name: 'Angro Investment'});
    //pending user goes here
    const stockUsersUserDetails = await Investment.find({investment_name: 'Stock Investment'});
    //blocked users goes here
    const fxUserDetails = await Investment.find({investment_name: 'FX Investment'});
    
      res.status(200).send({data: angorUsersDetails, 
        "stock_investor": stockUsersUserDetails, "fx_investors": fxUserDetails});
     // console.log("Data :: found", activeUserDetails);
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// delete investors details here..
router.delete("/delete_investors/:id", async (req, res) => {
  let myId = req.params.id;
  //console.log("Delete ID", req.params.id);
   try {
    // find record by the post ID
    const queryInvestor = await Investment.findOne({_id: req.params.id});
    //console.log("User Details", query);
    if(!queryInvestor || queryInvestor==null) {
     return res.status(403).send({ msg: "403" }); // No ID found
    }
    // delete the record found here
    const DeleteInvestor = await Investment.deleteOne(queryInvestor);

    if (DeleteInvestor.deletedCount ===1) {
      res.status(200).send({ msg: "200" });
      
    } else {
      res.status(404).send({ msg: "404" });
      console.log("No record deleted.");
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// approve investors investment details here..
router.delete("/approve_invest_investors/:id", async (req, res) => {
  let myId = req.params.id;
  const filter = { _id: req.params.id };
  console.log("Approval ID", req.params.id);
   try {
    // find record by the post ID
    const queryInvestor = await Investment.findOne({_id: req.params.id});
    //console.log("User Details", query);
    if(!queryInvestor || queryInvestor==null) {
     return res.status(403).send({ msg: "403" }); // No ID found
    }
    else if(queryInvestor){
      const updateDoc = {
        $set: {
          invest_status: "Approved",
          },
      }
      const DeleteInvestor = await Investment.updateOne(filter, updateDoc);
      console.log("Update status", DeleteInvestor);

      if (DeleteInvestor.modifiedCount ===1) {
        res.status(200).send({ msg: "200" });
        
      } else {
        res.status(404).send({ msg: "404" });
        console.log("No record deleted.");
      }
    }
   } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all users logs details with pagination here..
router.get("/user_logs", async (req, res) => {
  const page = req.query.page;
  //const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const all_logs = await UserLog.find().sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    const totalItems = await UserLog.countDocuments();
    res.status(200).send({ data: all_logs, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// get all users system activities logs details with pagination here..
router.get("/user_system_logs", async (req, res) => {
  const page = req.query.page;
  //const userId = req.query.id;
  const limit = req.query.pageSize;
  const totalItems = 0;
  const skip = (page - 1) * limit;
  try {
    const all_SystemLogs = await UserSystemLog.find().sort({ createdOn: -1 })
    .skip(skip);
    //.sort({field_name: sort order})
    const totalItems = await UserSystemLog.countDocuments();
    res.status(200).send({ data: all_SystemLogs, total_record: totalItems });

  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});

// delete system logs activities details here..
router.delete("/system_logs_delete/:id", async (req, res) => {
  let myId = req.params.id;
  //console.log("Delete ID", req.params.id);
   try {
    // find record by the post ID
    const queryLogs = await UserSystemLog.findOne({_id: req.params.id});
    //console.log("User Details", query);
    if(!queryLogs || queryLogs==null) {
     return res.status(403).send({ msg: "403" }); // No ID found
    }
    // delete the record found here
    const DeleteLogs = await UserSystemLog.deleteOne(queryLogs);

    if (DeleteLogs.deletedCount ===1) {
      res.status(200).send({ msg: "200" });
      
    } else {
      res.status(404).send({ msg: "404" });
      console.log("No record deleted.");
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});


// update bank officer profile details here..
router.post("/update_officer", upload.single("file"), async (req, res) => {
  const file = req.file;
  const imageUrl = "/images/" + file.filename;

  console.log("body data", req.body);
  try {
    const checkOfficer = await Officer.find().count(); // here I am checking if user exist then I will get user details
        console.log("database data ", checkOfficer)
       
    if (checkOfficer != 0) {
      const updateDoc = {
        $set: {
          surname: req.body.surname,
          first_name: req.body.first_name,
          gender: req.body.gender,
          email: req.body.email,
          staff_type: req.body.office_type,
          staff_id: req.body.staff_id,
          username: req.body.username,
          branch: req.body.branch_office,
          image_photo: imageUrl,
          bank_name: req.body.bank_name,
          acct_status: req.body.acct_status,
        },
      }
      const result = await Officer.updateOne(updateDoc);
     return res.status(200).send({msg: "200"});
          //console.log("User details: ", checkUser)
          //return res.status(404).send({ msg: '404' }); // Investment is already running
        }
    else if(checkOfficer == null || checkOfficer == undefined || checkOfficer == 0) {
    const officerData = await Officer.create({
          surname: req.body.surname,
          first_name: req.body.first_name,
          gender: req.body.gender,
          email: req.body.email,
          staff_type: req.body.office_type,
          staff_id: req.body.staff_id,
          username: req.body.username,
          branch: req.body.branch_office,
          image_photo: imageUrl,
          bank_name: req.body.bank_name,
          acct_status: req.body.acct_status,
    })
    saveRecord = await officerData.save();
    res.status(200).send({msg: "200"});
  }
    
  } catch (err) {
    res.status(500).json(err);
    console.log(err.message);
  }
});



  module.exports = router;