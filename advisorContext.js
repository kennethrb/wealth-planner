// ==================== FILE: advisorContext.js ====================

const AdvisorStates = {
    PROTECTION_GAP: "PROTECTION_GAP",
    CASH_CONSTRAINED: "CASH_CONSTRAINED",
    GOAL_ACCELERATION: "GOAL_ACCELERATION",
    OPPORTUNITY_RICH: "OPPORTUNITY_RICH",
    CAPITAL_DEPLOYMENT: "CAPITAL_DEPLOYMENT",
    STABLE: "STABLE"
};

function getAdvisorContext() {

    const buffer =
        window.qaBuffer ||
        loadBufferVsInvest();
    
    const protection = {
        totalCash:
            Number(buffer.availableCash || 0),
    
        requiredProtection:
            Number(buffer.bufferTarget || 0),
    
        protectionGap:
            Math.max(
                0,
                Number(buffer.bufferTarget || 0) -
                Number(buffer.availableCash || 0)
            )
    };

    console.log(
        "Protection Object",
        protection
    );


    const cashFlow =
        getOpportunityCapital();

    const advisorMemory =
        appData.advisorMemory || [];

    const activeGoals =
        (appData.goals || [])
            .filter(goal =>
                getGoalLifecycleState(goal) === "ACTIVE"
            );

    const completableGoals =
        activeGoals.filter(goal => {

            const remaining =
                Math.max(
                    0,
                    Number(goal.target || 0) -
                    Number(goal.current || 0)
                );

            return remaining <= cashFlow.opportunity;
        });


    console.log(
        "AdvisorContext Protection",
        {
            requiredProtection:
                protection.requiredProtection,
    
            protectionGap:
                protection.protectionGap,
    
            totalCash:
                protection.totalCash
        }
    );

    return {

        generatedAt:
            new Date().toISOString(),

        liquidity: {
            availableCash: protection.totalCash,
            coverage: cashFlow.coverage,
            safeToSpend: getSafeToSpend().safeToSpend
        },

        obligations: {
            protectedBills: protection.protectedObligations,
            requiredProtection: protection.requiredProtection,
            protectionGap: protection.protectionGap
        },

        goals: {
            activeCount: activeGoals.length,
            completableCount: completableGoals.length,
            completableGoals:
                completableGoals.map(g => g.goal)
        },

        cashFlow: {
            opportunityCapital: cashFlow.opportunity,
            surplus: cashFlow.surplus
        },

        advisorMemory: {
            totalRecommendations:
                advisorMemory.length,

            completed:
                advisorMemory.filter(
                    m => m.status === "COMPLETED"
                ).length,

            ignored:
                advisorMemory.filter(
                    m => m.status === "IGNORED"
                ).length
        }
    };
}
