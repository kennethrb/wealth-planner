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

    const protection =
        getUnifiedProtectionStatus(
            appData.accounts,
            appData.recurringBills,
            appData.goals,
            []
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
        }
                           }

