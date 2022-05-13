const express = require('express');
const Joi = require('joi');
const mySQL = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const { mysqlConfig, jwtSecret } = require('../../config');

const router = express.Router();

const userSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

router.post('/register', async (req, res) => {
  let userDetails;
  try {
    userDetails = await userSchema.validateAsync(req.body);
  } catch (err) {
    console.log(err);
    return res.status(400).send({ err: 'Incorrect data passed' });
  }

  try {
    const hash = bcrypt.hashSync(userDetails.password, 10);

    const con = await mySQL.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    INSERT INTO users (name, email, password)
    VALUES (${mySQL.escape(userDetails.name)}, ${mySQL.escape(userDetails.email)}, '${hash}' )
    `);
    await con.end();

    if (!data.insertId || data.affectedRows !== 1) {
      console.log(data);
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    return res.send({ msg: 'Succesfully created account', accountId: data.insertId });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/login', async (req, res) => {
  let userDetails;
  try {
    userDetails = await userLoginSchema.validateAsync(req.body);
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
