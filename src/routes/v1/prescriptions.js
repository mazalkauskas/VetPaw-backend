const express = require('express');
const mySQL = require('mysql2/promise');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig } = require('../../config');
const { prescriptionPostSchema } = require('../../middleware/Modules/contentSchemas');

const router = express.Router();

router.get('/:pet_id', isLoggedIn, async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT * FROM prescriptions
    JOIN pets ON (prescriptions.pet_id=pets.id)
    JOIN medications ON (prescriptions.med_id=medications.med_id)
    WHERE pet_id = ${req.params.pet_id}
    `);

    return res.send(data);
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/', isLoggedIn, validation(prescriptionPostSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
          INSERT INTO prescriptions (pet_id,med_id,comment)
          VALUES (
          ${mySQL.escape(req.body.pet_id)},
          ${mySQL.escape(req.body.medication_id)},
          ${mySQL.escape(req.body.comment)}
          )`);

    if (!data.insertId) {
      return res.status(500).send({ err: 'Server issue occured. Please try again later' });
    }

    await con.end();
    return res.send({ msg: 'Successfully appointed a prescription' });
  } catch (err) {
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
