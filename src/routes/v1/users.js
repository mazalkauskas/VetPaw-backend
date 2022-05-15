const express = require('express');
const mySQL = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const passwordGenerator = require('generate-password');
const fetch = require('node-fetch');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig, jwtSecret, mailServer, mailServerPassword } = require('../../config');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  newPasswordSchema,
} = require('../../middleware/Modules/authSchemas');

const router = express.Router();

router.post('/register', validation(registerSchema), async (req, res) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);
    const con = await mySQL.createConnection(mySQLConfig);
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
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT id, password 
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
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT password
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

router.post('/reset-password', validation(resetPasswordSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data1] = await con.execute(`SELECT id FROM users WHERE email = ${mySQL.escape(req.body.email)} LIMIT 1`);

    if (data1.length !== 1) {
      await con.end();
      return res.send({ msg: 'If your email is correct, you will shortly get a email' });
    }

    const randomCode = passwordGenerator.generate({
      length: 10,
      numbers: true,
    });

    const [data2] = await con.execute(`
    INSERT INTO passwordreset (email, code)
    VALUES (${mySQL.escape(req.body.email)}, '${randomCode}' )
    `);

    await con.end();

    if (!data2.insertId) {
      return res.status(500).send({ msg: 'Server issue occured. Please try again later' });
    }

    const response = await fetch(mailServer, {
      method: 'POST',
      body: JSON.stringify({
        password: mailServerPassword,
        email: req.body.email,
        message: `If you requested for a new password, please visit this link:
      http://localhost:8080/v1/users/new-password?email=${encodeURI(req.body.email)}&token=${randomCode}
    }}`,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();

    if (!json.info) {
      return res.status(500).send({ msg: 'Server issue occured. Please try again later' });
    }

    return res.send({ msg: 'If your email is correct, you will shortly get a message' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server issue occured. Please try again later' });
  }
});

router.post('/new-password', validation(newPasswordSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT * FROM passwordreset WHERE email = ${mySQL.escape(req.body.email)} 
    AND code = ${mySQL.escape(req.body.token)} LIMIT 1
    `);

    if (data.length !== 1) {
      await con.end();
      return res.status(400).send({ msg: 'Invalid change password request. Please try again' });
    }

    if ((new Date().getTime() - new Date(data[0].created_at).getTime()) / 60000 > 300) {
      await con.end();
      return res.status(400).send({ msg: 'Invalid change password request. Please try again2' });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const [changeResponse] = await con.execute(`
    UPDATE users SET password = ${mySQL.escape(hashedPassword)}
    WHERE email = ${mySQL.escape(req.body.email)}
    `);

    if (!changeResponse.affectedRows) {
      await con.end();
      return res.status(500).send({ msg: 'Server issue occured. Please try again later' });
    }

    await con.execute(`
    DELETE FROM passwordreset
    WHERE id = ${data[0].id}
    `);

    await con.end();
    return res.send({ msg: 'Password changed succesfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
