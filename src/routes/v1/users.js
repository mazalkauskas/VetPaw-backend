const express = require('express');
const mySQL = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const passwordGenerator = require('generate-password');
const fetch = require('node-fetch');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mysqlConfig, jwtSecret, mailServer, mailServerPassword } = require('../../config');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
} = require('../../middleware/validationSchemas/authVerification');

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
  try {
    const con = await mySQL.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    SELECT id, email, password 
    FROM users
    WHERE email = ${mySQL.escape(req.body.email)}
    LIMIT 1
    `);
    await con.end();

    if (data.length === 0) {
      return res.status(400).send({ err: 'User not found' });
    }

    if (!bcrypt.compareSync(req.body.password, data[0].password)) {
      return res.status(400).send({ err: 'Incorrect password ' });
    }

    const token = jsonwebtoken.sign({ accountId: data[0].id }, jwtSecret);

    return res.send({ msg: 'Succesfully logged in', token });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/change-password', isLoggedIn, validation(changePasswordSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    SELECT  password
    FROM users WHERE id = ${mySQL.escape(req.user.accountId)}
    LIMIT 1
    `);

    const compareHash = bcrypt.compareSync(req.body.oldPassword, data[0].password);

    if (!compareHash) {
      await con.end();
      return res.status(400).send({ msg: 'Incorrect old password' });
    }

    const newPasswordHash = bcrypt.hashSync(req.body.newPassword, 10);

    await con.execute(`
     UPDATE users SET password = ${mySQL.escape(newPasswordHash)} WHERE id = ${mySQL.escape(req.user.accountId)}
     `);
    await con.end();

    return res.send({ msg: 'Password changed' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/reset-password', isLoggedIn, validation(resetPasswordSchema), async (req, res) => {
  try {
    const randomPassword = passwordGenerator.generate({
      length: 10,
      numbers: true,
    });
    const passwordHash = bcrypt.hashSync(randomPassword, 10);

    const con = await mySQL.createConnection(mysqlConfig);
    const [data] = await con.execute(`
    UPDATE users SET password = ${mySQL.escape(passwordHash)} WHERE email = ${mySQL.escape(req.body.email)}
    `);
    await con.end();

    if (!data.affectedRows) {
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    const response = await fetch(mailServer, {
      method: 'POST',
      body: JSON.stringify({
        password: mailServerPassword,
        email: req.body.email,
        message: `Your new password is ${randomPassword}`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();
    console.log(json.info);

    return res.send({ msg: `New password has been sent to ${req.body.email}` });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
