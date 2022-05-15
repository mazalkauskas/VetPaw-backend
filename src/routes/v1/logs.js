const express = require('express');
const mySQL = require('mysql2/promise');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig } = require('../../config');
const { logGetSchema, logPostSchema } = require('../../middleware/Modules/logSchemas');

const router = express.Router();

router.get('/', isLoggedIn, validation(logGetSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT name,animal,breed,date_of_birth, FROM pets
    JOIN logs ON (pets.id=logs.pet_id)
    WHERE owner_email = '${req.body.owner_email}'
    `);

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/', isLoggedIn, validation(logPostSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
          INSERT INTO logs (pet_id, description, status)
          VALUES (
          ${mySQL.escape(req.body.pet_id)},
          ${mySQL.escape(req.body.description)},
          ${mySQL.escape(req.body.status)}
          )`);

    if (!data.insertId) {
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    await con.end();
    return res.send({ msg: 'Successfully created an entry' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
