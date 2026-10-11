// ==================== FILE: opportunityDetectors.js ====================
function detectGoalCompletionOpportunities() {

    const opportunityCapital =
        getOpportunityCapital().opportunity;

    return (appData.goals || [])
        .filter(goal =>
            getGoalLifecycleState(goal) === "ACTIVE"
        )
        .map(goal => {

            const remaining =
                Math.max(
                    0,
                    Number(goal.target || 0)
                    - Number(goal.current || 0)
                );

            if (
                remaining <= 0 ||
                remaining > opportunityCapital
            ) {
                return null;
            }

            return createOpportunity({
                type:
                    OpportunityType.GOAL_COMPLETION,

                title:
                    `Complete ${goal.goal}`,

                description:
                    "Goal can be completed immediately.",

                wealthImpact:
                    remaining,

                priority:
                    OpportunityPriority.HIGH,

                confidence:
                    90,

                action:
                    `Fund ${goal.goal} with ${formatCurrency(remaining)}`
            });

        })
        .filter(Boolean);
}
