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
    // Backward Compatibility
    ...ProtectionConfig,
    ...CashflowConfig,
    ...AdvisorConfig,
    ...CapitalAllocationConfig,
    ...WindfallConfig,
    ...InvestmentConfig,

    // New Domain Structure
    protection: ProtectionConfig,
    cashFlowDomain: CashflowConfig,
    advisor: AdvisorConfig,
    capitalAllocationDomain: CapitalAllocationConfig,
    windfall: WindfallConfig,
    investmentsDomain: InvestmentConfig
};
