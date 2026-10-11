// ==================== FILE: opportunityEngine.js ====================

const OpportunityType = {
    GOAL_COMPLETION: "GOAL_COMPLETION",
    CAPITAL_RELEASE: "CAPITAL_RELEASE",
    IDLE_CASH: "IDLE_CASH",
    PROTECTION_GAP: "PROTECTION_GAP",
    DEBT_REDUCTION: "DEBT_REDUCTION",
    INVESTMENT_DEPLOYMENT: "INVESTMENT_DEPLOYMENT"
};

const OpportunityPriority = {
    CRITICAL: "CRITICAL",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW"
};

function createOpportunity({
    type,
    title,
    description,
    wealthImpact = 0,
    priority = OpportunityPriority.MEDIUM,
    confidence = 50,
    action = ""
}) {
    return {
        id: `OPP_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}`,

        createdAt: new Date().toISOString(),

        type,
        title,
        description,

        wealthImpact,
        priority,
        confidence,

        action
    };
}
