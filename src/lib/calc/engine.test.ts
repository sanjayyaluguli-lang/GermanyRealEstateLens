import { describe, expect, it } from "vitest";
import { calculate, defaultInputs, type CalcInputs } from "./engine";

const base = (over: Partial<CalcInputs> = {}): CalcInputs => ({
  ...defaultInputs("NW"),
  purchasePrice: 200_000,
  livingArea: 60,
  monthlyColdRent: 800,
  equity: 40_000,
  netIncome: 4_000,
  interestRatePct: 4,
  repaymentRatePct: 2,
  transferTaxPct: 6.5,
  notaryPct: 2,
  brokerPct: 3.57,
  nonAllocableCostsMonthly: 50,
  maintenancePerSqmYear: 12,
  vacancyBufferPct: 0,
  ...over,
});

describe("calculate", () => {
  it("computes side costs, loan and annuity", () => {
    const r = calculate(base());
    expect(r.transferTax).toBe(13_000);
    expect(r.notaryCosts).toBe(4_000);
    expect(r.brokerCosts).toBe(7_140);
    expect(r.acquisitionCosts).toBe(24_140);
    expect(r.totalInvestment).toBe(224_140);
    expect(r.loanAmount).toBe(184_140);
    expect(r.ltvPct).toBeCloseTo(92.07, 2);
    // 184,140 × 6 % / 12
    expect(r.monthlyAnnuity).toBeCloseTo(920.7, 2);
    expect(r.monthlyInterest).toBeCloseTo(613.8, 2);
    // 50 + 60 m² × 12 € / 12
    expect(r.monthlyOperatingCosts).toBe(110);
    expect(r.monthlyCashflow).toBeCloseTo(800 - 110 - 920.7, 2);
    expect(r.grossYieldPct).toBeCloseTo(4.8, 5);
    expect(r.priceFactor).toBeCloseTo(20.83, 2);
  });

  it("max purchase price exactly meets the goal", () => {
    for (const goal of ["interest_coverage", "cashflow_positive", "equity_buildup"] as const) {
      const r = calculate(base({ goal }));
      expect(r.maxPurchasePrice).not.toBeNull();
      const atMax = calculate(base({ goal, purchasePrice: r.maxPurchasePrice! }));
      expect(atMax.goalMet).toBe(true);
      expect(atMax.goalMargin).toBeLessThan(1);
      const above = calculate(base({ goal, purchasePrice: r.maxPurchasePrice! + 1_000 }));
      expect(above.goalMet).toBe(false);
    }
  });

  it("required rent exactly meets the goal", () => {
    const r = calculate(base({ vacancyBufferPct: 4 }));
    const atRequired = calculate(base({ vacancyBufferPct: 4, monthlyColdRent: r.requiredMonthlyRent! }));
    expect(Math.abs(atRequired.goalMargin)).toBeLessThan(0.05);
  });

  it("interest coverage is easier than full cash-flow", () => {
    const ic = calculate(base({ goal: "interest_coverage" }));
    const cf = calculate(base({ goal: "cashflow_positive" }));
    expect(ic.maxPurchasePrice!).toBeGreaterThan(cf.maxPurchasePrice!);
    expect(ic.requiredMonthlyRent!).toBeLessThan(cf.requiredMonthlyRent!);
  });

  it("equity build-up allows a salary top-up scaled by risk tolerance", () => {
    const low = calculate(base({ goal: "equity_buildup", riskTolerance: "low" }));
    const high = calculate(base({ goal: "equity_buildup", riskTolerance: "high" }));
    expect(low.allowedMonthlyShortfall).toBe(200);
    expect(high.allowedMonthlyShortfall).toBe(800);
    expect(high.maxPurchasePrice!).toBeGreaterThan(low.maxPurchasePrice!);
  });

  it("returns null max price when costs exceed rent", () => {
    const r = calculate(base({ monthlyColdRent: 50, goal: "cashflow_positive" }));
    expect(r.maxPurchasePrice).toBeNull();
    expect(r.status).toBe("red");
  });

  it("flags unbounded max price with zero debt service", () => {
    const r = calculate(base({ interestRatePct: 0, repaymentRatePct: 0 }));
    expect(r.maxPurchasePriceUnbounded).toBe(true);
    expect(r.maxPurchasePrice).toBeNull();
  });

  it("amortises the loan over the projection", () => {
    const r = calculate(base({ repaymentRatePct: 3 }));
    const debts = r.projection.map((y) => y.remainingDebt);
    for (let i = 1; i < debts.length; i++) expect(debts[i]).toBeLessThanOrEqual(debts[i - 1]);
    expect(r.payoffYears).not.toBeNull();
    expect(r.payoffYears!).toBeGreaterThan(20);
    expect(r.payoffYears!).toBeLessThan(30);
    expect(r.residualDebtAtFixedRateEnd).toBe(r.projection[9].remainingDebt);
  });

  it("no loan when equity covers everything", () => {
    const r = calculate(base({ equity: 500_000 }));
    expect(r.loanAmount).toBe(0);
    expect(r.payoffYears).toBe(0);
    expect(r.status).toBe("green");
  });

  it("warns when equity does not cover side costs", () => {
    const r = calculate(base({ equity: 10_000 }));
    expect(r.warnings).toContain("equity_below_costs");
    expect(r.warnings).toContain("ltv_over_100");
  });

  it("green for a clearly profitable deal, red for a loss-maker", () => {
    expect(calculate(base({ purchasePrice: 120_000, monthlyColdRent: 900 })).status).toBe("green");
    expect(calculate(base({ purchasePrice: 400_000, monthlyColdRent: 900 })).status).toBe("red");
  });

  it("rejects invalid input", () => {
    expect(() => calculate(base({ livingArea: 0 }))).toThrow();
    expect(() => calculate({ ...base(), bundesland: "XX" } as unknown as CalcInputs)).toThrow();
  });
});
