const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load Admin Login Validation
const validateAdminLoginInput = require('../../validation/adminlogin');

//load admin model
const Admin = require('../../models/Admin')

// @route   POST api/admin/register
// @desc    register admin
// @access  Public
router.post('/register',(req,res)=>{
    const newAdmin = new Admin({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    })
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(newAdmin.password,salt,(err,hash)=>{
            if(err) throw err;
            newAdmin.password = hash;
            newAdmin
                .save()
                .then(admin=>res.json(admin))
                .catch(err=>console.log(err));
        })
        
    })
});

// @route   PUT api/admin/update/:_id
// @desc    update admin
// @access  Private
router.put('/update/:_id',(req,res)=>{
    const updatedAdmin = new Admin({
        _id:req.params,
        username:req.body.username,
        password: req.body.password,
        email:req.body.email
    })
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(updatedAdmin.password,salt,(err,hash)=>{
            if(err) throw err;
            updatedAdmin.password = hash;
                Admin.findOneAndUpdate(
                    {_id:updatedAdmin._id},
                    {$set:{
                        "username":updatedAdmin.username,
                        "password":updatedAdmin.password,
                        "email":updatedAdmin.email
                    }}
                )
                .then(admin=>res.json(admin))
                .catch(err=>console.log(err));
        })
        
    })
})

// @route   POST api/admin/login
// @desc    Login user / Return Token
// @access  Public
router.post('/login',(req,res)=>{

    const {errors,isValid} = validateAdminLoginInput(req.body);

    // Check Validation
    if(isValid){
        return res.status(400).json(errors);
    }

    const username= req.body.username;
    const password= req.body.password;

    //find admin by username
    Admin.findOne({username})
        .then(admin =>{
            //check for username
            if(!admin){
                errors.username = 'Username incorrect';
                return res.status(404).json(errors);
            }

            //check password
            bcrypt.compare(password,admin.password)
                .then(isMatch=>{
                    if(isMatch){
                        // admin matched
                        const payload = { id:admin.id,username:admin.username,password:admin.password,email:admin.email} // create JWT Payload
                        //sign Token
                        jwt.sign(payload,keys.secretOrKey,{expiresIn:3600},(err,token)=>{
                            res.json({
                                success:true,
                                token: 'Bearer '+token
                            });
                        });
                    }else{
                        errors.password = 'Password incorrect';
                        return res.status(400).json(errors);
                    }
                })
        });
})

// @route   POST api/admin/current
// @desc    Return current Admin
// @access  Private
router.get('/account',passport.authenticate('jwt',{session:false}),(req,res)=>{
    const errors = {};
    Admin.findOne({_id:req.user.id})
        .then(admin=>{
            console.log(admin)
            if(!admin){
                errors.noadmin="Not authorized";
                return res.status(404).json(errors);
            }
            res.json(admin);
        })
        .catch(err=>res.status(404).json(err));
});

module.exports = router;