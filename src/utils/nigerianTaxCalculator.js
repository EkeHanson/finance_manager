// Nigerian Tax Calculator Utility
// Implements Nigerian tax laws for investment management system

export class NigerianTaxCalculator {

  // Withholding Tax Rates (as per Nigerian tax law)
  static WHT_RATES = {
    DIVIDENDS: 0.10,      // 10% on dividends
    INTEREST: 0.10,       // 10% on interest/ROI
    RENT: 0.10,           // 10% on rent
    COMMISSION: 0.05,     // 5% on commission
    PROFESSIONAL_SERVICES: 0.05, // 5% on professional services
    CONTRACTS: 0.025,     // 2.5% on contracts
  };

  // Personal Income Tax (PIT) brackets for individuals
  static PIT_BRACKETS = [
    { min: 0, max: 300000, rate: 0.07 },           // 7% on first ₦300,000
    { min: 300001, max: 600000, rate: 0.11 },      // 11% on ₦300,001 - ₦600,000
    { min: 600001, max: 1100000, rate: 0.15 },     // 15% on ₦600,001 - ₦1,100,000
    { min: 1100001, max: 1600000, rate: 0.19 },    // 19% on ₦1,100,001 - ₦1,600,000
    { min: 1600001, max: 3200000, rate: 0.21 },    // 21% on ₦1,600,001 - ₦3,200,000
    { min: 3200001, max: Infinity, rate: 0.24 },    // 24% on amounts above ₦3,200,000
  ];

  // Capital Gains Tax
  static CGT_RATE = 0.10; // 10% on capital gains

  // Value Added Tax
  static VAT_RATE = 0.075; // 7.5% VAT

  // Tertiary Education Tax
  static TET_RATE = 0.025; // 2.5% for companies with turnover > ₦25M

  // Companies Income Tax
  static COMPANY_TAX_RATES = {
    STANDARD: 0.30,      // 30% standard rate
    SMALL_COMPANY: 0.20, // 20% for turnover ≤ ₦25M
  };

  /**
   * Calculate Withholding Tax for different types of income
   * @param {number} amount - The gross amount
   * @param {string} type - Type of income (DIVIDENDS, INTEREST, RENT, etc.)
   * @returns {object} - { grossAmount, whtAmount, netAmount, whtRate }
   */
  static calculateWHT(amount, type) {
    const whtRate = this.WHT_RATES[type] || 0;
    const whtAmount = amount * whtRate;
    const netAmount = amount - whtAmount;

    return {
      grossAmount: amount,
      whtRate,
      whtAmount,
      netAmount,
      type
    };
  }

  /**
   * Calculate Personal Income Tax (PIT) for individuals
   * @param {number} annualIncome - Annual taxable income
   * @returns {object} - { annualIncome, taxAmount, effectiveRate, breakdown }
   */
  static calculatePIT(annualIncome) {
    let remainingIncome = annualIncome;
    let totalTax = 0;
    const breakdown = [];

    for (const bracket of this.PIT_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1);
      const taxInBracket = taxableInBracket * bracket.rate;

      if (taxInBracket > 0) {
        breakdown.push({
          bracket: `₦${bracket.min.toLocaleString()} - ₦${bracket.max === Infinity ? 'Above' : bracket.max.toLocaleString()}`,
          rate: (bracket.rate * 100) + '%',
          taxableAmount: taxableInBracket,
          taxAmount: taxInBracket
        });
      }

      totalTax += taxInBracket;
      remainingIncome -= taxableInBracket;
    }

    const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;

    return {
      annualIncome,
      taxAmount: totalTax,
      effectiveRate,
      breakdown
    };
  }

  /**
   * Calculate Capital Gains Tax
   * @param {number} capitalGain - The capital gain amount
   * @returns {object} - { capitalGain, cgtAmount, netAmount, cgtRate }
   */
  static calculateCGT(capitalGain) {
    const cgtAmount = capitalGain * this.CGT_RATE;
    const netAmount = capitalGain - cgtAmount;

    return {
      capitalGain,
      cgtRate: this.CGT_RATE,
      cgtAmount,
      netAmount
    };
  }

  /**
   * Calculate Value Added Tax
   * @param {number} amount - The amount before VAT
   * @returns {object} - { amount, vatAmount, totalAmount, vatRate }
   */
  static calculateVAT(amount) {
    const vatAmount = amount * this.VAT_RATE;
    const totalAmount = amount + vatAmount;

    return {
      amount,
      vatRate: this.VAT_RATE,
      vatAmount,
      totalAmount
    };
  }

  /**
   * Calculate Tertiary Education Tax
   * @param {number} assessableProfit - Company's assessable profit
   * @param {number} turnover - Company's turnover
   * @returns {object} - { assessableProfit, turnover, tetAmount, tetRate, isApplicable }
   */
  static calculateTET(assessableProfit, turnover) {
    const isApplicable = turnover > 25000000; // ₦25M threshold
    const tetAmount = isApplicable ? assessableProfit * this.TET_RATE : 0;

    return {
      assessableProfit,
      turnover,
      tetRate: this.TET_RATE,
      tetAmount,
      isApplicable
    };
  }

  /**
   * Calculate Company Income Tax
   * @param {number} taxableProfit - Taxable profit
   * @param {number} turnover - Company turnover
   * @returns {object} - { taxableProfit, turnover, taxAmount, taxRate, rateType }
   */
  static calculateCompanyTax(taxableProfit, turnover) {
    const isSmallCompany = turnover <= 25000000; // ₦25M threshold
    const taxRate = isSmallCompany ? this.COMPANY_TAX_RATES.SMALL_COMPANY : this.COMPANY_TAX_RATES.STANDARD;
    const taxAmount = taxableProfit * taxRate;

    return {
      taxableProfit,
      turnover,
      taxRate,
      taxAmount,
      rateType: isSmallCompany ? 'Small Company (20%)' : 'Standard (30%)'
    };
  }

  /**
   * Calculate comprehensive tax for investment income
   * @param {number} roiAmount - ROI payment amount
   * @param {number} annualIncome - Investor's total annual income (for PIT context)
   * @returns {object} - Complete tax breakdown
   */
  static calculateInvestmentTaxes(roiAmount, annualIncome = 0) {
    // WHT on ROI (treated as interest)
    const wht = this.calculateWHT(roiAmount, 'INTEREST');

    // PIT on the net amount (after WHT)
    const pitIncome = annualIncome + wht.netAmount;
    const pit = this.calculatePIT(pitIncome);

    // Total tax burden
    const totalTax = wht.whtAmount + pit.taxAmount;
    const effectiveTotalRate = roiAmount > 0 ? totalTax / roiAmount : 0;

    return {
      roiAmount,
      wht,
      pit: {
        ...pit,
        note: 'PIT calculated on total annual income including this ROI'
      },
      totalTax,
      effectiveTotalRate,
      netAfterAllTaxes: roiAmount - totalTax
    };
  }

  /**
   * Generate tax certificate/report data
   * @param {object} investor - Investor data
   * @param {object} payment - Payment/transaction data
   * @returns {object} - Tax certificate data
   */
  static generateTaxCertificate(investor, payment) {
    const taxCalculation = this.calculateInvestmentTaxes(payment.amount, investor.annualIncome || 0);

    return {
      certificateNumber: `TAX-${Date.now()}`,
      investor: {
        name: investor.name,
        tin: investor.tin || 'Not Provided',
        address: investor.address
      },
      payment: {
        date: payment.date,
        description: payment.description,
        grossAmount: payment.amount,
        type: payment.type
      },
      taxBreakdown: taxCalculation,
      issuedDate: new Date().toISOString().split('T')[0],
      validityPeriod: 'Current Tax Year'
    };
  }

  /**
   * Format currency in Nigerian Naira
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage
   * @param {number} rate - Rate to format (0.10 = 10%)
   * @returns {string} - Formatted percentage string
   */
  static formatPercentage(rate) {
    return (rate * 100).toFixed(2) + '%';
  }
}

// Export individual functions for convenience
export const calculateWHT = NigerianTaxCalculator.calculateWHT.bind(NigerianTaxCalculator);
export const calculatePIT = NigerianTaxCalculator.calculatePIT.bind(NigerianTaxCalculator);
export const calculateCGT = NigerianTaxCalculator.calculateCGT.bind(NigerianTaxCalculator);
export const calculateVAT = NigerianTaxCalculator.calculateVAT.bind(NigerianTaxCalculator);
export const calculateInvestmentTaxes = NigerianTaxCalculator.calculateInvestmentTaxes.bind(NigerianTaxCalculator);
export const generateTaxCertificate = NigerianTaxCalculator.generateTaxCertificate.bind(NigerianTaxCalculator);
export const formatCurrency = NigerianTaxCalculator.formatCurrency.bind(NigerianTaxCalculator);
export const formatPercentage = NigerianTaxCalculator.formatPercentage.bind(NigerianTaxCalculator);