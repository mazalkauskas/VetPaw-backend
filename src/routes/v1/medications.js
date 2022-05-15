const express = require('express');
const mySQL = require('mysql2/promise');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig } = require('../../config');
const { medPostSchema } = require('../../middleware/Modules/contentSchemas');

const router = express.Router();

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute('SELECT * FROM medications');
    await con.end();

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/', isLoggedIn, validation(medPostSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
        INSERT INTO medications (med_name, description)
        VALUES (
        ${mySQL.escape(req.body.med_name)},
        ${mySQL.escape(req.body.description)}
        )`);

    if (!data.insertId) {
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    await con.end();
    return res.send({ msg: 'Succesfully added a medicine' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
