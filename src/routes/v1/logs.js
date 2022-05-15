const express = require('express');
const mySQL = require('mysql2/promise');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig } = require('../../config');
const { logPostSchema } = require('../../middleware/Modules/contentSchemas');

const router = express.Router();

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT pet_name, description, visit_type FROM pets
    JOIN logs ON (pets.id=logs.pet_id)
    WHERE pet_id = ${mySQL.escape(req.body.pet_id)}
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
          INSERT INTO logs (pet_id, description, visit_type)
          VALUES (
          ${mySQL.escape(req.body.pet_id)},
          ${mySQL.escape(req.body.description)},
          ${mySQL.escape(req.body.visit_type)}
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
