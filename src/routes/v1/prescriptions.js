const express = require('express');
const mySQL = require('mysql2/promise');
const isLoggedIn = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { mySQLConfig } = require('../../config');
const { prescriptionGetSchema, prescriptionPostSchema } = require('../../middleware/Modules/prescriptionSchemas');

const router = express.Router();

router.get('/', isLoggedIn, validation(prescriptionGetSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
    SELECT name,animal,breed,date_of_birth,med_name,description,comment FROM prescriptions
    JOIN pets ON (prescriptions.pet_id=pets.id)
    JOIN medications ON (prescriptions.medication_id=medications.id)
    WHERE owner_email = '${req.body.owner_email}'
    `);

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

router.post('/', isLoggedIn, validation(prescriptionPostSchema), async (req, res) => {
  try {
    const con = await mySQL.createConnection(mySQLConfig);
    const [data] = await con.execute(`
          INSERT INTO prescriptions (pet_id,medication_id,comment)
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
    console.log(err);
    return res.status(500).send({ err: 'Server issue occured. Please try again later' });
  }
});

module.exports = router;
