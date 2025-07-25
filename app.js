const express = require('express');
const app = express();
const loanRoutes = require('./routes/loanRoutes');
const db = require('./models');

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello from Bank System API!');
});
app.use('/api/v1', loanRoutes);

// Sync DB and start server
db.sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
});
