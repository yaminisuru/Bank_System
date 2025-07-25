// models/index.js
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite',
});

const Customer = require('./Customer')(sequelize);
const Loan = require('./Loan')(sequelize);
const Payment = require('./Payment')(sequelize);

// Associations
Customer.hasMany(Loan, { foreignKey: 'customerId', onDelete: 'CASCADE' });
Loan.belongsTo(Customer, { foreignKey: 'customerId' });

Loan.hasMany(Payment, { foreignKey: 'loanId', onDelete: 'CASCADE' });
Payment.belongsTo(Loan, { foreignKey: 'loanId' });

module.exports = {
  sequelize,
  Customer,
  Loan,
  Payment,
};
