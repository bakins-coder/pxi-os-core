
import { Employee, PayrollItem } from '../types';

/**
 * Nigeria Tax Engine (Configurable)
 * Based on Finance Act 2020 / PITA amendments
 */

// Configuration Constants
const PENSION_RATE_EMPLOYEE = 0.08;
const PENSION_RATE_EMPLOYER = 0.10;
const NHF_RATE = 0.025;
const MINIMUM_WAGE = 70000; // Updated 2024 Baseline

// Consolidated Relief Allowance (CRA) Rules
const calculateCRA = (grossIncome: number, consolidatedPension: number) => {
  const fixedRelief = 200000;
  const variableRelief = 0.01 * grossIncome;
  const higherRelief = Math.max(fixedRelief, variableRelief);
  
  // Plus 20% of Gross Income after deducting Pension (Tax exempt)
  const remainingGross = grossIncome - consolidatedPension;
  const percentRelief = 0.20 * remainingGross;
  
  return higherRelief + percentRelief;
};

// Annual Tax Bands
const TAX_BANDS = [
  { limit: 300000, rate: 0.07 },
  { limit: 300000, rate: 0.11 },
  { limit: 500000, rate: 0.15 },
  { limit: 500000, rate: 0.19 },
  { limit: 1600000, rate: 0.21 },
  { limit: Infinity, rate: 0.24 }
];

export const calculatePayrollForEmployee = (employee: Employee): PayrollItem => {
  const annualGross = employee.salary;
  const monthlyGross = annualGross / 12;

  // 1. Break down Gross (Simplification: 50% Basic, 30% Housing, 20% Transport)
  const basic = monthlyGross * 0.5;
  const housing = monthlyGross * 0.3;
  const transport = monthlyGross * 0.2;

  // 2. Pension (Monthly)
  // Basis: Usually Basic + Housing + Transport (Total Emoluments)
  const pensionEmployee = monthlyGross * PENSION_RATE_EMPLOYEE;
  const pensionEmployer = monthlyGross * PENSION_RATE_EMPLOYER;

  // 3. National Housing Fund (NHF) - 2.5% of Basic
  const nhf = basic * NHF_RATE;

  // 4. PAYE Calculation (Annualized first)
  let annualTax = 0;
  
  // Minimum wage exemption check
  if (monthlyGross <= MINIMUM_WAGE) {
    annualTax = 0;
  } else {
    // Determine Taxable Income
    const annualPension = pensionEmployee * 12;
    const annualNHF = nhf * 12;
    const annualCRA = calculateCRA(annualGross, annualPension);
    
    // Tax exempt deductions
    const totalRelief = annualPension + annualNHF + annualCRA;
    
    let taxableIncome = annualGross - totalRelief;
    if (taxableIncome < 0) taxableIncome = 0;

    // Apply Bands
    let remainingTaxable = taxableIncome;
    
    for (const band of TAX_BANDS) {
      if (remainingTaxable <= 0) break;
      const taxableAtBand = Math.min(remainingTaxable, band.limit);
      annualTax += taxableAtBand * band.rate;
      remainingTaxable -= taxableAtBand;
    }
    
    // Minimum Tax Rule: 1% of Gross if calculated tax is lower (usually for high earners with massive reliefs, but statutory for all)
    // Simplified: Use calculated tax for standard Payroll demo
  }

  const monthlyTax = annualTax / 12;

  // 5. Net Pay
  const totalDeductions = pensionEmployee + nhf + monthlyTax;
  const netPay = monthlyGross - totalDeductions;

  // 6. Anomalies Check (AI Signal)
  const anomalies: string[] = [];
  if (netPay < 0) anomalies.push("Negative Net Pay calculated.");
  if (monthlyGross < MINIMUM_WAGE) anomalies.push("Below National Minimum Wage.");

  return {
    id: `pay-${Date.now()}-${employee.id}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    gross: monthlyGross,
    basic,
    housing,
    transport,
    pensionEmployee,
    pensionEmployer,
    tax: monthlyTax,
    nhf,
    net: netPay,
    anomalies
  };
};
