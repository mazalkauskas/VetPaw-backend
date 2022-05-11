const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/v1/users');

const { serverPort } = require('./config');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send({ msg: 'Server is running' });
});

app.use('/v1/users/', userRoutes);

app.all('*', (req, res) => {
  res.status(404).send({ err: 'Page not found' });
});

app.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort}`);
});
