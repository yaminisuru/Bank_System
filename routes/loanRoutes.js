const express = require('express');
const router = express.Router();
const { Customer, Loan, Payment } = require('../models');

// Create a new customer
router.post('/customers', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a loan for a customer
router.post('/loans', async (req, res) => {
  try {
    const { amount, interestRate, termMonths, customerId } = req.body;

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const loan = await Loan.create({ amount, interestRate, termMonths, customerId });
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all loans
router.get('/loans', async (req, res) => {
  try {
    const loans = await Loan.findAll({ include: Customer });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Make a payment for a loan
router.post('/payments', async (req, res) => {
  try {
    const { loanId, amountPaid, paymentDate } = req.body;

    // Check if loan exists
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const payment = await Payment.create({ loanId, amountPaid, paymentDate });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: Loan });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
