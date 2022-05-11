const express = require('express');
// const joi = require('joi');
const mySQL = require('mysql2/promise');

const { mysqlConfig } = require('../../config');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const con = await mySQL.createConnection(mysqlConfig);
    console.log('Successfully logged into the database');
    const [data] = await con.execute('SELECT * FROM users');
    await con.end();

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'A server issue has occurred - please try again later' });
  }
});

module.exports = router;
