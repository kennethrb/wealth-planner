// ==================== FILE: wealthStateEngine.js ====================

function getWealthState() {

    const context =
        getAdvisorContext();

    if (context.obligations.protectionGap > 0) {
        return AdvisorStates.PROTECTION_GAP;
    }

    if (context.liquidity.coverage < 1) {
        return AdvisorStates.CASH_CONSTRAINED;
    }

    if (context.goals.completableCount > 0) {
        return AdvisorStates.GOAL_ACCELERATION;
    }

    if (context.cashFlow.opportunityCapital > 100000) {
        return AdvisorStates.OPPORTUNITY_RICH;
    }

    if (context.cashFlow.opportunityCapital > 0) {
        return AdvisorStates.CAPITAL_DEPLOYMENT;
    }

    return AdvisorStates.STABLE;
}
