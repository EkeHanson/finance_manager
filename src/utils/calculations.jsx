// Calculate monthly interest
export function calculateMonthlyInterest(principal, rate) {
  // rate is annual percentage, e.g. 39.6 for 39.6%
  const monthlyRate = rate / 12 / 100;
  return principal * monthlyRate;
}

// Compound interest if not withdrawn
export function compoundInterest(principal, rate, months, withdrawals = []) {
  let balance = principal;
  let history = [];
  for (let m = 1; m <= months; m++) {
    const interest = calculateMonthlyInterest(balance, rate);
    // If withdrawal for this month, do not compound
    const withdrawn = withdrawals[m - 1] || 0;
    if (withdrawn > 0) {
      history.push({ month: m, interest, withdrawn, balance });
      balance -= withdrawn;
    } else {
      balance += interest;
      history.push({ month: m, interest, withdrawn: 0, balance });
    }
  }
  return { balance, history };
}

// Example usage for dummy data:
// const result = compoundInterest(500000, 39.6, 6, [0,0,0,0,0,0]);
// result.history gives month-by-month breakdown
