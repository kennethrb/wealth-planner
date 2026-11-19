// ==================== FILE: recommendationRanking.js ====================

function getRankedRecommendations()
{
    const wealthState = getWealthState();

    const recommendations = [];

    //
    // EVIDENCE COLLECTION
    //

    const healthEvidence =
        window.qaFinancialHealthAdvisor?.evidence || [];

    const protectionEvidence =
        window.qaBuffer?.evidence || [];

    const deploymentEvidence =
        window.qaSweep?.evidence || [];

    const purchaseEvidence =
        window.qaPurchase?.evidence || [];

    //
    // PROTECTION FIRST
    //

    const hasProtectionGap =
        wealthState === AdvisorStates.PROTECTION_GAP ||
        protectionEvidence.some(
            e => e.type === "BUFFER_PRIORITY"
        );

    if (hasProtectionGap)
    {
        recommendations.push({
            id: "PROTECT_LIQUIDITY",
            priority: 1000,
            title: "Increase Protection Reserve",
            reason:
                "Protection Gap detected. Available liquidity remains below protection requirements.",
            state: AdvisorStates.PROTECTION_GAP
        });
    }

    //
    // CASH FLOW
    //

    const hasSavingsGap =
        healthEvidence.some(
            e => e.type === "SAVINGS_GAP"
        );

    if (hasSavingsGap)
    {
        recommendations.push({
            id: "IMPROVE_SAVINGS_RATE",
            priority: 700,
            title: "Increase Savings Rate",
            reason:
                "Current savings behavior is limiting long‑term wealth growth.",
            state: "SAVINGS_GAP"
        });
    }

    //
    // GOAL ACCELERATION
    //

    if (
        wealthState === AdvisorStates.GOAL_ACCELERATION &&
        window.qaGoalFundingOptimizer?.completable
    )
    {
        recommendations.push({
            id: "COMPLETE_GOAL",
            priority: 800,
            title:
                window.qaGoalFundingOptimizer.priorityAction,
            reason:
                window.qaGoalFundingOptimizer.reason,
            state: AdvisorStates.GOAL_ACCELERATION
        });
    }

    //
    // CAPITAL DEPLOYMENT
    //

    const hasDeploymentCapacity =
        deploymentEvidence.some(
            e => e.type === "DEPLOYABLE_CAPITAL"
        );

    if (
        wealthState === AdvisorStates.CAPITAL_DEPLOYMENT ||
        hasDeploymentCapacity
    )
    {
        recommendations.push({
            id: "DEPLOY_CAPITAL",
            priority: 600,
            title: "Deploy Available Capital",
            reason:
                "Protected capital is available for wealth acceleration.",
            state: AdvisorStates.CAPITAL_DEPLOYMENT
        });
    }

    //
    // PURCHASE RISK
    //

    const hasPurchaseRisk =
        purchaseEvidence.some(
            e => e.type === "PROTECTION_BREACH"
        );

    if (hasPurchaseRisk)
    {
        recommendations.push({
            id: "DEFER_PURCHASE",
            priority: 900,
            title: "Delay Major Purchase",
            reason:
                "Purchase would reduce protected liquidity below required levels.",
            state: "PURCHASE_RISK"
        });
    }

    //
    // FALLBACK
    //

    if (recommendations.length === 0)
    {
        recommendations.push({
            id: "MAINTAIN_STABILITY",
            priority: 1,
            title: "Maintain Stability",
            reason:
                "No critical action detected.",
            state: AdvisorStates.STABLE
        });
    }

    return recommendations.sort(
        (a, b) => b.priority - a.priority
    );
}
