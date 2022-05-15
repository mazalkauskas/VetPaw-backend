const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/v1/users');
const petsRoutes = require('./routes/v1/pets');
const medicationsRoutes = require('./routes/v1/medications');
const logsRoutes = require('./routes/v1/logs');
const prescriptionsRoutes = require('./routes/v1/prescriptions');
const { serverPort } = require('./config');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send({ msg: 'Server is running' });
});

app.use('/v1/users/', userRoutes);
app.use('/v1/pets/', petsRoutes);
app.use('/v1/medications/', medicationsRoutes);
app.use('/v1/logs/', logsRoutes);
app.use('/v1/prescriptions/', prescriptionsRoutes);

app.all('*', (req, res) => {
  res.status(404).send({ err: 'Page not found' });
});

app.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort}`);
});
