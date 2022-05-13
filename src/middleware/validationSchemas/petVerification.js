const express = require('express');
const mysql = require('mysql2/promise');
const { mysqlConfig, mailServer, mailServerPassword } = require('../../config');
const { petRegistration } = require('../../middleware/validationSchemas/petVerification');
const router = require('../../routes/v1/users');

router.post('/', loggedIn, validation(petRegistration), async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);
    const [data] = await con.execute(`
        INSERT INTO pets (name, owner_email)
        VALUES (${mysql.escape(req.body.name)}, ${mysql.escape(req.body.ownerEmail)})
        `);

    if (!data.insertId) {
      await con.end();
    }
  } catch (err) {
    console.log(err);
  }
});
