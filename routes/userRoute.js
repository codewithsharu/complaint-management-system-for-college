const express = require('express');
const router = express();
const passport = require('passport'); 
require('../passport');

router.use(passport.initialize()); 
router.use(passport.session());

const userController = require('../controllers/userController');

router.get('/g/c', userController.loadAuth);

// Auth 
router.get('/auth/google' , passport.authenticate('google', { scope: 
	[ 'email', 'profile' ] 
})); 

// Auth Callback 
router.get( '/auth/google/callback', 
	passport.authenticate( 'google', { 
		successRedirect: '/success', 
		failureRedirect: '/failure'
}));

// Success 
router.get('/success' , userController.successGoogleLogin); 

// failure 
router.get('/failure' , userController.failureGoogleLogin);

router.get('/lo', (req, res) => {
    req.logout(); // Passport.js function to clear login session
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

module.exports = router;