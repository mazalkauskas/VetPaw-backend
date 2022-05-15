const express = require('express');
const mySQL = require('mysql2/promise');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig } = require('../../config');
const { petPostSchema } = require('../../middleware/Modules/contentSchemas');

const router = express.Router();

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT * FROM pets WHERE archived != 1
    `);

    await con.end();
    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/', isLoggedIn, validation(petPostSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    INSERT INTO pets (pet_name, owner_email, animal, breed, date_of_birth)
    VALUES (
    ${mySQL.escape(req.body.pet_name)},
    ${mySQL.escape(req.body.owner_email)},
    ${mySQL.escape(req.body.animal)},
    ${mySQL.escape(req.body.breed)},
    ${mySQL.escape(req.body.date_of_birth)}
    )`);

    if (!data.insertId) {
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    await con.end();
    return res.send({ msg: 'Succesfully added a pet' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    await con.execute(`
     UPDATE pets SET archived = 1 WHERE id = ${req.body.id}
     `);

    await con.end();
    return res.send({ msg: 'Pet was removed' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
