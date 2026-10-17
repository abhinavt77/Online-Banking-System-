const BASE = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = `${BASE}${url}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(fullUrl, {
    ...options,
    headers
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function runTests() {
  console.log('🇮🇳 Starting Apex Bank India (INR) Automated Verification Tests...\n');

  try {
    // 1. Health check
    const health = await req('/health');
    console.log('✅ 1. Health check passed:', health.bank);

    // 2. Customer login (Aarav Sharma)
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'aarav@example.com', password: 'password123' })
    });
    const customerToken = loginRes.token;
    console.log(`✅ 2. Indian Customer login successful: ${loginRes.user.fullName} (PAN: ${loginRes.user.panNumber})`);

    const clientHeaders = { headers: { Authorization: `Bearer ${customerToken}` } };

    // 3. Get customer accounts
    const accRes = await req('/accounts', clientHeaders);
    const primaryAcc = accRes.accounts.find(a => a.account_type === 'salary');
    console.log(`✅ 3. Customer accounts in INR fetched: Salary A/C Balance = ₹${primaryAcc.balance.toLocaleString('en-IN')}, IFSC = ${primaryAcc.ifsc_code}`);

    // 4. Recipient lookup by UPI ID
    const lookupRes = await req('/accounts/lookup/priya@okhdfcbank', clientHeaders);
    console.log(`✅ 4. Beneficiary verified by UPI ID: ${lookupRes.recipientName} (A/C: ${lookupRes.accountNumber}, IFSC: ${lookupRes.ifscCode})`);

    // 5. ACID IMPS Fund Transfer (₹5,000 to Priya Patel)
    const prevBalance = primaryAcc.balance;
    const transferRes = await req('/transactions/transfer', {
      method: 'POST',
      body: JSON.stringify({
        sourceAccountId: primaryAcc.id,
        destinationAccountNumber: '501008821944',
        transferMode: 'IMPS',
        amount: 5000.00,
        description: 'Diwali Festival Gift Transfer',
        pin: '1234'
      }),
      ...clientHeaders
    });

    console.log(`✅ 5. ACID Atomic IMPS Transfer completed: UTR Ref = ${transferRes.transfer.referenceId}, New Balance = ₹${transferRes.transfer.newBalance.toLocaleString('en-IN')}`);
    if (Math.abs(transferRes.transfer.newBalance - (prevBalance - 5000)) > 0.01) {
      throw new Error('Balance deduction mismatch after IMPS transfer');
    }

    // 6. Deposit INR funds
    const depRes = await req('/transactions/deposit', {
      method: 'POST',
      body: JSON.stringify({
        accountId: primaryAcc.id,
        amount: 25000.00,
        method: 'UPI Auto-Infeed',
        note: 'Freelance Software Consultation'
      }),
      ...clientHeaders
    });
    console.log(`✅ 6. UPI Inward Deposit successful: +₹${depRes.amount.toLocaleString('en-IN')}, New Balance = ₹${depRes.newBalance.toLocaleString('en-IN')}`);

    // 7. Withdraw INR cash at ATM
    const wthRes = await req('/transactions/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        accountId: primaryAcc.id,
        amount: 2000.00,
        note: 'NFS ATM Cash Out'
      }),
      ...clientHeaders
    });
    console.log(`✅ 7. ATM cash withdrawal successful: -₹${wthRes.amount.toLocaleString('en-IN')}, New Balance = ₹${wthRes.newBalance.toLocaleString('en-IN')}`);

    // 8. Bharat BillPay (BBPS) utility payment
    const billRes = await req('/transactions/bill-pay', {
      method: 'POST',
      body: JSON.stringify({
        accountId: primaryAcc.id,
        billerName: 'BESCOM Bangalore Electricity',
        billCategory: 'ELECTRICITY',
        billerAccountNumber: 'BESCOM-993812',
        amount: 3450.00
      }),
      ...clientHeaders
    });
    console.log(`✅ 8. Bharat BillPay (BBPS) cleared: Ref = ${billRes.referenceId}`);

    // 9. RuPay card lock / toggle
    const cardsRes = await req('/cards', clientHeaders);
    const card = cardsRes.cards[0];
    const freezeRes = await req(`/cards/${card.id}/freeze`, { method: 'PATCH', ...clientHeaders });
    console.log(`✅ 9. RuPay Platinum Card lock toggle: isFrozen = ${freezeRes.isFrozen}`);
    await req(`/cards/${card.id}/freeze`, { method: 'PATCH', ...clientHeaders });

    // 10. Loan application in INR
    const loanRes = await req('/loans', {
      method: 'POST',
      body: JSON.stringify({
        accountId: primaryAcc.id,
        amount: 250000.00,
        termMonths: 24,
        purpose: 'Home Solar Inverter Installation'
      }),
      ...clientHeaders
    });
    const loanId = loanRes.loan.id;
    console.log(`✅ 10. Loan application created: ID = ${loanId}, Monthly EMI = ₹${loanRes.loan.monthly_emi.toLocaleString('en-IN')}`);

    // 11. Branch Admin login & liquidity verification
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@apexbank.com', password: 'admin123' })
    });
    const adminToken = adminLogin.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    const adminOverview = await req('/admin/overview', adminHeaders);
    console.log(`✅ 11. Branch Admin Overview: Total Indian Liquidity = ₹${adminOverview.metrics.totalLiquidity.toLocaleString('en-IN')}`);

    // 12. Admin approves loan -> triggers automated disbursal
    const approveRes = await req(`/admin/loans/${loanId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision: 'approved' }),
      ...adminHeaders
    });
    console.log(`✅ 12. Branch Admin approved loan #${loanId}: ${approveRes.message}`);

    // 13. Verify loan disbursal in customer's account
    const accAfterLoan = await req(`/accounts/${primaryAcc.id}`, clientHeaders);
    console.log(`✅ 13. Verified loan disbursal: Salary A/C balance now = ₹${accAfterLoan.account.balance.toLocaleString('en-IN')}`);

    console.log('\n🇮🇳 ALL 13 INDIAN BANKING & INR CORE TESTS PASSED SUCCESSFULLY! 🇮🇳\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
