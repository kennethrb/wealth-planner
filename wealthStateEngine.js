// ==================== FILE: wealthStateEngine.js ====================

function getWealthState() {

    const context =
        getAdvisorContext();

    const coverage =
        Number(
            context.liquidity.coverage || 0
        );

    const protectionGap =
        Number(
            context.obligations.protectionGap || 0
        );

    const minimumCoverage =
        CONFIG.cashFlowDomain.cashFlow.minimumCoverage;

    const healthyCoverage =
        CONFIG.cashFlowDomain.cashFlow.healthyCoverage;

    if (protectionGap > 0) {
        return AdvisorStates.PROTECTION_GAP;
    }

    if (coverage <= 0) {
        return AdvisorStates.CASH_CONSTRAINED;
    }

    if (coverage < minimumCoverage) {
        return AdvisorStates.CASH_CONSTRAINED;
    }

    if (context.goals.completableCount > 0) {
        return AdvisorStates.GOAL_ACCELERATION;
    }

    if (
        coverage >= healthyCoverage &&
        context.cashFlow.opportunityCapital > 0
    ) {
        return AdvisorStates.CAPITAL_DEPLOYMENT;
    }

    if (
        context.cashFlow.opportunityCapital >
        CONFIG.opportunity.thresholds.opportunityRichThreshold
    ) {
        return AdvisorStates.OPPORTUNITY_RICH;
    }

    return AdvisorStates.STABLE;
}
