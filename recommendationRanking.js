// ==================== FILE: recommendationRanking.js ====================

function getRankedRecommendations() {

    const context = getAdvisorContext();
    const wealthState = getWealthState();

    const recommendations = [];

    if (wealthState === AdvisorStates.PROTECTION_GAP) {
        recommendations.push({
            id: "PROTECT_LIQUIDITY",
            priority: 100,
            title: "Protect liquidity",
            reason: "Cash reserves are below protection requirements.",
            state: wealthState
        });
    }

    if (wealthState === AdvisorStates.CASH_CONSTRAINED) {
        recommendations.push({
            id: "INCREASE_CASH_BUFFER",
            priority: 90,
            title: "Increase cash buffer",
            reason: "Coverage level remains below target.",
            state: wealthState
        });
    }

    if (wealthState === AdvisorStates.GOAL_ACCELERATION) {
        recommendations.push({
            id: "COMPLETE_GOAL",
            priority: 80,
            title: "Accelerate a goal",
            reason: "Available capital can complete a goal now.",
            state: wealthState
        });
    }

    if (wealthState === AdvisorStates.CAPITAL_DEPLOYMENT) {
        recommendations.push({
            id: "DEPLOY_CAPITAL",
            priority: 70,
            title: "Deploy excess capital",
            reason: "Protected capital appears available.",
            state: wealthState
        });
    }

    return recommendations
        .sort((a, b) => b.priority - a.priority);
}
