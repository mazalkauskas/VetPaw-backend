const express = require('express');
const mySQL = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const validation = require('../../middleware/validation');
const { mysqlConfig, jwtSecret } = require('../../config');
const { registerSchema, loginSchema } = require('../../middleware/validationSchemas/authVerification');

const router = express.Router();

router.post('/register', validation(registerSchema), async (req, res) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);
    const con = await mySQL.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    INSERT INTO users (name, email, password)
    VALUES (${mySQL.escape(req.body.name)}, ${mySQL.escape(req.body.email)}, '${hash}' )
    `);
    await con.end();

    if (!data.insertId) {
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    return res.send({ msg: 'Succesfully created account', accountId: data.insertId });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/login', validation(loginSchema), async (req, res) => {
  let userDetails;
  try {
    userDetails = await req.body.validateAsync(req.body);
  } catch (err) {
    console.log(err);
    return res.status(400).send({ err: 'Incorrect data passed' });
  }

  try {
    const con = await mySQL.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    SELECT id, email, password 
    FROM users
    WHERE email = ${mySQL.escape(userDetails.email)}
    LIMIT 1
    `);
    await con.end();

    if (data.length === 0) {
      return res.status(400).send({ err: 'User not found' });
    }

    if (!bcrypt.compareSync(userDetails.password, data[0].password)) {
      return res.status(400).send({ err: 'Incorrect password ' });
    }

    return res.send({ msg: 'Succesfully logged in', accountId: data[0].id });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
