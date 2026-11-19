// ==================== FILE: advisorContext.js ====================

const AdvisorStates = {
    PROTECTION_GAP: "PROTECTION_GAP",
    CASH_CONSTRAINED: "CASH_CONSTRAINED",
    GOAL_ACCELERATION: "GOAL_ACCELERATION",
    OPPORTUNITY_RICH: "OPPORTUNITY_RICH",
    CAPITAL_DEPLOYMENT: "CAPITAL_DEPLOYMENT",
    STABLE: "STABLE"
};

function getAdvisorContext()
{
    const buffer =
        window.qaBuffer;

    /*
    ---------------------------------------
    HYDRATION GUARD
    ---------------------------------------

    Advisor Context should consume state.

    It should never trigger
    intelligence engines.

    If prerequisite intelligence has
    not yet loaded, return a safe
    placeholder context.

    */
    if (!buffer)
    {
        return {
            generatedAt:
                new Date().toISOString(),

            liquidity: {
                availableCash: 0,
                coverage: 0,
                safeToSpend: 0
            },

            obligations: {
                requiredProtection: 0,
                protectionGap: 0
            },

            goals: {
                activeCount: 0,
                completableCount: 0,
                completableGoals: []
            },

            cashFlow: {
                opportunityCapital: 0,
                surplus: 0
            },

            advisorMemory: {
                totalRecommendations: 0,
                completed: 0,
                ignored: 0
            }
        };
    }

    const protection = {

        totalCash:
            Number(
                buffer.availableCash || 0
            ),

        requiredProtection:
            Number(
                buffer.bufferTarget || 0
            ),

        protectionGap:
            Math.max(
                0,
                Number(
                    buffer.bufferTarget || 0
                ) -
                Number(
                    buffer.availableCash || 0
                )
            )
    };

    const cashFlow =
        getOpportunityCapital();

    const advisorMemory =
        appData.advisorMemory || [];

    const activeGoals =
        (appData.goals || [])
            .filter(
                goal =>
                    getGoalLifecycleState(goal)
                    === "ACTIVE"
            );

    const completableGoals =
        activeGoals.filter(goal =>
        {
            const remaining =
                Math.max(
                    0,
                    Number(goal.target || 0) -
                    getGoalCurrent(goal)
                );

            return (
                remaining <=
                cashFlow.opportunity
            );
        });

    return {

        generatedAt:
            new Date().toISOString(),

        liquidity: {

            availableCash:
                protection.totalCash,

            coverage:
                cashFlow.coverage,

            safeToSpend:
                getSafeToSpend()
                    .safeToSpend
        },

        obligations: {

            requiredProtection:
                protection.requiredProtection,

            protectionGap:
                protection.protectionGap
        },

        goals: {

            activeCount:
                activeGoals.length,

            completableCount:
                completableGoals.length,

            completableGoals:
                completableGoals.map(
                    g => g.goal
                )
        },

        cashFlow: {

            opportunityCapital:
                cashFlow.opportunity,

            surplus:
                cashFlow.surplus
        },

        advisorMemory: {

            totalRecommendations:
                advisorMemory.length,

            completed:
                advisorMemory.filter(
                    m =>
                        m.status ===
                        "COMPLETED"
                ).length,

            ignored:
                advisorMemory.filter(
                    m =>
                        m.status ===
                        "IGNORED"
                ).length
        }
    };
}
