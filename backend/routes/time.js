const express = require('express');
const router = express.Router();
const { getTime } = require('../controllers/timeController');

router.get('/', getTime);

module.exports = router;
