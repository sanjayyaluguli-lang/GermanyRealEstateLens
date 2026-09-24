// Pure financing calculator for buy-to-let property in Germany.
// No I/O: shared by the browser (live results) and the server (results that
// get persisted are always recomputed server-side from the inputs).

import { z } from "zod";
import { BUNDESLAND_CODES, transferTaxFor } from "./regions";

export const GOALS = ["interest_coverage", "cashflow_positive", "equity_buildup"] as const;
export type Goal = (typeof GOALS)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskTolerance = (typeof RISK_LEVELS)[number];

export type Status = "green" | "yellow" | "red";

const money = z.coerce.number().finite().min(0).max(100_000_000);
const pct = (max: number) => z.coerce.number().finite().min(0).max(max);

export const calcInputSchema = z.object({
  bundesland: z.enum(BUNDESLAND_CODES),
  purchasePrice: money,
  livingArea: z.coerce.number().finite().min(1).max(100_000),
  monthlyColdRent: money,
  equity: money,
  netIncome: money,
  interestRatePct: pct(20),
  repaymentRatePct: pct(20),
  fixedRateYears: z.coerce.number().int().min(1).max(40),
  transferTaxPct: pct(15),
  notaryPct: pct(10),
  brokerPct: pct(10),
  nonAllocableCostsMonthly: money,
  maintenancePerSqmYear: pct(200),
  vacancyBufferPct: pct(50),
  rentGrowthPct: pct(20),
  costGrowthPct: pct(20),
  valueGrowthPct: pct(20),
  goal: z.enum(GOALS),
  riskTolerance: z.enum(RISK_LEVELS),
});

export type CalcInputs = z.infer<typeof calcInputSchema>;

/** Defaults used when neither the profile nor the scenario supplies a value. */
export function defaultInputs(bundesland: CalcInputs["bundesland"] = "NW"): CalcInputs {
  return {
    bundesland,
    purchasePrice: 250_000,
    livingArea: 65,
    monthlyColdRent: 850,
    equity: 50_000,
    netIncome: 3_500,
    interestRatePct: 3.8,
    repaymentRatePct: 2.0,
    fixedRateYears: 10,
    transferTaxPct: transferTaxFor(bundesland),
    notaryPct: 2.0,
    brokerPct: 3.57,
    nonAllocableCostsMonthly: 60,
    maintenancePerSqmYear: 12,
    vacancyBufferPct: 3,
    rentGrowthPct: 1.5,
    costGrowthPct: 2.0,
    valueGrowthPct: 1.5,
    goal: "cashflow_positive",
    riskTolerance: "medium",
  };
}

/**
 * Share of net income the user is willing to top up each month under the
 * "equity build-up" goal (negative cash flow is accepted because the Tilgung
 * builds equity).
 */
export const MONTHLY_TOPUP_SHARE: Record<RiskTolerance, number> = {
  low: 0.05,
  medium: 0.1,
  high: 0.2,
};

/** Max loan payment (annuity) as a share of net income before we warn. */
export const MAX_DEBT_SERVICE_SHARE: Record<RiskTolerance, number> = {
  low: 0.3,
  medium: 0.4,
  high: 0.5,
};

export type WarningCode =
  | "equity_below_costs"
  | "ltv_over_100"
  | "debt_service_high"
  | "low_gross_yield"
  | "high_price_factor"
  | "high_residual_debt"
  | "no_rent";

export interface ProjectionYear {
  year: number;
  rent: number; // annual effective rent (after vacancy buffer)
  costs: number; // annual non-allocable costs + maintenance reserve
  interest: number;
  principal: number;
  cashflow: number;
  cumulativeCashflow: number;
  remainingDebt: number;
  propertyValue: number;
  equityInProperty: number;
}

export interface CalcResults {
  transferTax: number;
  notaryCosts: number;
  brokerCosts: number;
  acquisitionCosts: number;
  totalInvestment: number;
  loanAmount: number;
  equityUsed: number;
  ltvPct: number;
  monthlyInterest: number;
  monthlyRepayment: number;
  monthlyAnnuity: number;
  effectiveMonthlyRent: number;
  monthlyOperatingCosts: number;
  monthlyCashflowBeforeRepayment: number;
  monthlyCashflow: number;
  grossYieldPct: number;
  netYieldPct: number;
  priceFactor: number | null;
  allowedMonthlyShortfall: number;
  goalMargin: number; // monthly € above (+) or below (−) the goal threshold
  goalMet: boolean;
  requiredMonthlyRent: number | null;
  maxPurchasePrice: number | null; // null = no price satisfies the goal (or unbounded)
  maxPurchasePriceUnbounded: boolean; // true when there is no debt service (0 % rate and Tilgung)
  debtServiceSharePct: number | null;
  residualDebtAtFixedRateEnd: number;
  payoffYears: number | null;
  projection: ProjectionYear[];
  status: Status;
  warnings: WarningCode[];
}

const PROJECTION_YEARS = 30;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Monthly debt-service factor relevant to the goal (per € of loan). */
function goalLoanFactor(i: CalcInputs) {
  const rate = i.interestRatePct / 100;
  const repay = i.repaymentRatePct / 100;
  return i.goal === "interest_coverage" ? rate / 12 : (rate + repay) / 12;
}

function allowedShortfall(i: CalcInputs) {
  return i.goal === "equity_buildup" ? i.netIncome * MONTHLY_TOPUP_SHARE[i.riskTolerance] : 0;
}

function sideCostShare(i: CalcInputs) {
  return (i.transferTaxPct + i.notaryPct + i.brokerPct) / 100;
}

export function calculate(raw: CalcInputs): CalcResults {
  const i = calcInputSchema.parse(raw);
  const rate = i.interestRatePct / 100;
  const repay = i.repaymentRatePct / 100;

  const transferTax = i.purchasePrice * (i.transferTaxPct / 100);
  const notaryCosts = i.purchasePrice * (i.notaryPct / 100);
  const brokerCosts = i.purchasePrice * (i.brokerPct / 100);
  const acquisitionCosts = transferTax + notaryCosts + brokerCosts;
  const totalInvestment = i.purchasePrice + acquisitionCosts;
  const loanAmount = Math.max(0, totalInvestment - i.equity);
  const equityUsed = totalInvestment - loanAmount;
  const ltvPct = i.purchasePrice > 0 ? (loanAmount / i.purchasePrice) * 100 : 0;

  const monthlyInterest = (loanAmount * rate) / 12;
  const monthlyRepayment = (loanAmount * repay) / 12;
  const monthlyAnnuity = monthlyInterest + monthlyRepayment;

  const vacancy = i.vacancyBufferPct / 100;
  const effectiveMonthlyRent = i.monthlyColdRent * (1 - vacancy);
  const monthlyMaintenance = (i.livingArea * i.maintenancePerSqmYear) / 12;
  const monthlyOperatingCosts = i.nonAllocableCostsMonthly + monthlyMaintenance;
  const monthlyCashflowBeforeRepayment = effectiveMonthlyRent - monthlyOperatingCosts - monthlyInterest;
  const monthlyCashflow = effectiveMonthlyRent - monthlyOperatingCosts - monthlyAnnuity;

  const annualRent = i.monthlyColdRent * 12;
  const grossYieldPct = i.purchasePrice > 0 ? (annualRent / i.purchasePrice) * 100 : 0;
  const netYieldPct =
    totalInvestment > 0 ? (((effectiveMonthlyRent - monthlyOperatingCosts) * 12) / totalInvestment) * 100 : 0;
  const priceFactor = annualRent > 0 ? i.purchasePrice / annualRent : null;

  // Goal: effectiveRent − operatingCosts − loan·k ≥ −allowedShortfall
  const k = goalLoanFactor(i);
  const shortfall = allowedShortfall(i);
  const goalCashflow = i.goal === "interest_coverage" ? monthlyCashflowBeforeRepayment : monthlyCashflow;
  const goalMargin = goalCashflow + shortfall;
  const goalMet = goalMargin >= 0;

  const requiredEffectiveRent = monthlyOperatingCosts + loanAmount * k - shortfall;
  const requiredMonthlyRent =
    vacancy >= 1 ? null : Math.max(0, requiredEffectiveRent) / (1 - vacancy);

  // Solve the (piecewise linear) goal inequality for the purchase price.
  let maxPurchasePrice: number | null = null;
  const headroom = effectiveMonthlyRent - monthlyOperatingCosts + shortfall;
  const maxPurchasePriceUnbounded = headroom >= 0 && k === 0;
  if (headroom >= 0 && k > 0) {
    const maxLoan = headroom / k;
    maxPurchasePrice = Math.floor((maxLoan + i.equity) / (1 + sideCostShare(i)));
  }

  const debtServiceSharePct = i.netIncome > 0 ? (monthlyAnnuity / i.netIncome) * 100 : null;

  // Year-by-year projection with a monthly annuity schedule. The fixed rate is
  // assumed to continue after the Zinsbindung (follow-up financing risk is
  // surfaced via residualDebtAtFixedRateEnd).
  const projection: ProjectionYear[] = [];
  let debt = loanAmount;
  let cumulative = 0;
  let residualDebtAtFixedRateEnd = loanAmount;
  let payoffYears: number | null = loanAmount === 0 ? 0 : null;
  for (let year = 1; year <= PROJECTION_YEARS; year++) {
    const growthR = Math.pow(1 + i.rentGrowthPct / 100, year - 1);
    const growthC = Math.pow(1 + i.costGrowthPct / 100, year - 1);
    const yearRent = effectiveMonthlyRent * 12 * growthR;
    const yearCosts = monthlyOperatingCosts * 12 * growthC;
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let m = 0; m < 12 && debt > 0; m++) {
      const interest = (debt * rate) / 12;
      const principal = Math.max(0, Math.min(debt, monthlyAnnuity - interest));
      yearInterest += interest;
      yearPrincipal += principal;
      debt -= principal;
    }
    if (debt < 0.005) debt = 0;
    if (debt === 0 && payoffYears === null) payoffYears = year;
    const cashflow = yearRent - yearCosts - yearInterest - yearPrincipal;
    cumulative += cashflow;
    const propertyValue = i.purchasePrice * Math.pow(1 + i.valueGrowthPct / 100, year);
    if (year === i.fixedRateYears) residualDebtAtFixedRateEnd = debt;
    projection.push({
      year,
      rent: round2(yearRent),
      costs: round2(yearCosts),
      interest: round2(yearInterest),
      principal: round2(yearPrincipal),
      cashflow: round2(cashflow),
      cumulativeCashflow: round2(cumulative),
      remainingDebt: round2(debt),
      propertyValue: round2(propertyValue),
      equityInProperty: round2(propertyValue - debt),
    });
  }

  const warnings: WarningCode[] = [];
  if (i.equity < acquisitionCosts) warnings.push("equity_below_costs");
  if (ltvPct > 100) warnings.push("ltv_over_100");
  if (debtServiceSharePct !== null && debtServiceSharePct > MAX_DEBT_SERVICE_SHARE[i.riskTolerance] * 100)
    warnings.push("debt_service_high");
  if (i.monthlyColdRent === 0) warnings.push("no_rent");
  else if (grossYieldPct < 3.5) warnings.push("low_gross_yield");
  if (priceFactor !== null && priceFactor > 30) warnings.push("high_price_factor");
  if (loanAmount > 0 && residualDebtAtFixedRateEnd / loanAmount > 0.75) warnings.push("high_residual_debt");

  let status: Status;
  if (!goalMet || warnings.includes("no_rent")) status = "red";
  else if (
    goalMargin < Math.max(50, i.monthlyColdRent * 0.05) ||
    warnings.some((w) => w === "equity_below_costs" || w === "ltv_over_100" || w === "debt_service_high")
  )
    status = "yellow";
  else status = "green";

  return {
    transferTax: round2(transferTax),
    notaryCosts: round2(notaryCosts),
    brokerCosts: round2(brokerCosts),
    acquisitionCosts: round2(acquisitionCosts),
    totalInvestment: round2(totalInvestment),
    loanAmount: round2(loanAmount),
    equityUsed: round2(equityUsed),
    ltvPct: round2(ltvPct),
    monthlyInterest: round2(monthlyInterest),
    monthlyRepayment: round2(monthlyRepayment),
    monthlyAnnuity: round2(monthlyAnnuity),
    effectiveMonthlyRent: round2(effectiveMonthlyRent),
    monthlyOperatingCosts: round2(monthlyOperatingCosts),
    monthlyCashflowBeforeRepayment: round2(monthlyCashflowBeforeRepayment),
    monthlyCashflow: round2(monthlyCashflow),
    grossYieldPct: round2(grossYieldPct),
    netYieldPct: round2(netYieldPct),
    priceFactor: priceFactor === null ? null : round2(priceFactor),
    allowedMonthlyShortfall: round2(shortfall),
    goalMargin: round2(goalMargin),
    goalMet,
    requiredMonthlyRent: requiredMonthlyRent === null ? null : round2(requiredMonthlyRent),
    maxPurchasePrice,
    maxPurchasePriceUnbounded,
    debtServiceSharePct: debtServiceSharePct === null ? null : round2(debtServiceSharePct),
    residualDebtAtFixedRateEnd: round2(residualDebtAtFixedRateEnd),
    payoffYears,
    projection,
    status,
    warnings,
  };
}
