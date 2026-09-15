/**
 * ============================================================
 * WEALTH PLANNER CONFIGURATION
 * ============================================================
 *
 * Centralized advisor constants.
 * Removes magic numbers from intelligence engines.
 *
 * ============================================================
 */
const CONFIG = {
    emergencyFundMonths: 6,
    capitalAllocation: {
        emergencyFund: 0.25,
        debtReduction: 0.15,
        goals: 0.20,
        investments: 0.40
    },
    
    opportunityAllocation: {
        reserveRatio: 0.70
    },
    
    wealthProjection: {
        annualReturn: 0.07
    },
    buffer: {
        months: 3
    },
    
    financialHealth: {
        savingsTargetRate: 20,
        maxDebtRate: 30
    },
    
    cashFlow: {
        minimumCoverage: 1,
        healthyCoverage: 3,
        unlimitedCoverage: 999
    },
    
    assetAllocation: {
        targetCashPercent: 20,
        warningCashPercent: 40
    },
    
    idleCashAllocation: {
        goals: 0.50,
        investments: 0.50
    },
    
    bufferVsInvest: {
    invest: 0.80,
    debt: 0.20
    },
    
    surplusDeployment: {
    invest: 0.70,
    debt: 0.20,
    emergency: 0.10
    },
    
    cashFlowDeployment: {
    goals: 0.30,
    investments: 0.50,
    debtReduction: 0.20
    },

    projection: {
    investableRatio: 0.70
    },

    wealthSweep: {
    debt: 0.20,
    emergency: 0.10,
    investment: 0.70,
    projectedReturn: 0.08
    },

    inflation: {
    warning: 5,
    critical: 10
    },

    payCycle: {
    paydayDay: 15,
    bufferReserveRatio: 0.20
    }
};
