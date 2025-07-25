const { Loan, Payment, Customer } = require('../models');
const { v4: uuidv4 } = require('uuid');

const calculateLoanDetails = (principal, years, rate) => {
  const interest = principal * years * (rate / 100);
  const total = principal + interest;
  const emi = total / (years * 12);
  return { interest, total, emi };
};


exports.createCustomer = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const customer = await Customer.create({ name });
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createLoan = async (req, res) => {
  try {
    const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;
    const loanId = uuidv4();
    const { interest, total, emi } = calculateLoanDetails(loan_amount, loan_period_years, interest_rate_yearly);

    await Loan.create({
      id: loanId,
      customerId: customer_id,
      principal: loan_amount,
      interestRate: interest_rate_yearly,
      loanPeriodYears: loan_period_years,
      totalInterest: interest,
      totalAmount: total,
      monthlyEmi: emi
    });

    res.status(201).json({
      loan_id: loanId,
      customer_id,
      total_amount_payable: total,
      monthly_emi: emi
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create loan', detail: err.message });
  }
};

exports.makePayment = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amount, payment_type } = req.body;

    const loan = await Loan.findByPk(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    await Payment.create({
      id: uuidv4(),
      loanId,
      amount,
      paymentType: payment_type
    });

    // Get total paid
    const payments = await Payment.findAll({ where: { loanId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = loan.totalAmount - totalPaid;
    const emisLeft = Math.ceil(remaining / loan.monthlyEmi);

    // Mark as paid off
    if (remaining <= 0) {
      loan.status = 'PAID_OFF';
      await loan.save();
    }

    res.json({
      payment_id: uuidv4(),
      loan_id: loanId,
      message: 'Payment recorded successfully.',
      remaining_balance: Math.max(0, remaining),
      emis_left: Math.max(0, emisLeft)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment', detail: err.message });
  }
};

exports.getLedger = async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await Loan.findByPk(loanId);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const payments = await Payment.findAll({ where: { loanId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = loan.totalAmount - totalPaid;
    const emisLeft = Math.ceil(remaining / loan.monthlyEmi);

    res.json({
      loan_id: loan.id,
      customer_id: loan.customerId,
      principal: loan.principal,
      total_amount: loan.totalAmount,
      monthly_emi: loan.monthlyEmi,
      amount_paid: totalPaid,
      balance_amount: Math.max(0, remaining),
      emis_left: Math.max(0, emisLeft),
      transactions: payments.map(p => ({
        transaction_id: p.id,
        date: p.paymentDate,
        amount: p.amount,
        type: p.paymentType
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get ledger', detail: err.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const { customerId } = req.params;
    const loans = await Loan.findAll({ where: { customerId } });

    const result = await Promise.all(loans.map(async (loan) => {
      const payments = await Payment.findAll({ where: { loanId: loan.id } });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const emisLeft = Math.ceil((loan.totalAmount - totalPaid) / loan.monthlyEmi);

      return {
        loan_id: loan.id,
        principal: loan.principal,
        total_amount: loan.totalAmount,
        total_interest: loan.totalInterest,
        emi_amount: loan.monthlyEmi,
        amount_paid: totalPaid,
        emis_left: Math.max(0, emisLeft)
      };
    }));

    res.json({
      customer_id: customerId,
      total_loans: loans.length,
      loans: result
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get overview', detail: err.message });
  }
};
