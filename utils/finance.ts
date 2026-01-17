
interface CashFlow {
  amount: number;
  date: Date;
}

/**
 * Calculates the Extended Internal Rate of Return (XIRR).
 * Formula: sum(amount_i / (1 + rate)^((date_i - date_0) / 365)) = 0
 */
export function calculateXIRR(cashFlows: CashFlow[]): number {
  if (cashFlows.length < 2) return 0;

  // Initial guess (10%)
  let rate = 0.1;
  const maxIterations = 100;
  const precision = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    let f = 0;
    let df = 0;

    for (const flow of cashFlows) {
      const days = (flow.date.getTime() - cashFlows[0].date.getTime()) / (1000 * 60 * 60 * 24);
      const yearFraction = days / 365;
      const factor = Math.pow(1 + rate, yearFraction);
      
      f += flow.amount / factor;
      df -= (flow.amount * yearFraction) / (factor * (1 + rate));
    }

    if (Math.abs(df) < 1e-12) break;

    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < precision) return newRate * 100;
    rate = newRate;
  }

  return rate * 100;
}
