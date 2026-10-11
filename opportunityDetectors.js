// ==================== FILE: opportunityDetectors.js ====================

function detectGoalCompletionOpportunities() {

    const opportunities = [];

    const opportunityCapital =
        Number(
            getOpportunityCapital().opportunity || 0
        );

    (appData.goals || [])

        .filter(goal =>
            getGoalLifecycleState(goal) === "ACTIVE"
        )

        .forEach(goal => {

            const remaining =
                Math.max(
                    0,
                    Number(goal.target || 0)
                    - Number(goal.current || 0)
                );

            if (
                remaining > 0 &&
                remaining <= opportunityCapital
            ) {

                opportunities.push(

                    createOpportunity({

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

                    })
                );
            }

        });

    return opportunities;
}


function detectCapitalReleaseOpportunities() {

    const opportunities = [];

    const released =
        getReleasedCapitalSummary();

    if (
        released &&
        released.totalReleasedCapital > 0
    ) {

        opportunities.push(

            createOpportunity({

                type:
                    OpportunityType.CAPITAL_RELEASE,

                title:
                    "Deploy Released Capital",

                description:
                    "Graduated goals released recurring capital.",

                wealthImpact:
                    Number(
                        released.tenYearImpact || 0
                    ),

                priority:
                    OpportunityPriority.HIGH,

                confidence:
                    95,

                action:
                    released.recommendation

            })
        );

    }

    return opportunities;
}


function detectIdleCashOpportunities() {

    const opportunities = [];

    const capital =
        getOpportunityCapital();

    if (
        Number(capital.opportunity || 0) > 50000
    ) {

        opportunities.push(

            createOpportunity({

                type:
                    OpportunityType.IDLE_CASH,

                title:
                    "Deploy Idle Capital",

                description:
                    "Available capital exceeds protection requirements.",

                wealthImpact:
                    Number(capital.opportunity || 0),

                priority:
                    OpportunityPriority.MEDIUM,

                confidence:
                    85,

                action:
                    `Deploy ${formatCurrency(capital.opportunity)}`

            })

        );

    }

    return opportunities;
}


function getDetectedOpportunities() {

    return [

        ...detectGoalCompletionOpportunities(),

        ...detectCapitalReleaseOpportunities(),

        ...detectIdleCashOpportunities()

    ];

}

function debugOpportunityEngine() {

    console.group(
        "Opportunity Engine"
    );

    console.log(
        "Capital",
        getOpportunityCapital()
    );

    console.log(
        "Detected",
        getDetectedOpportunities()
    );

    console.log(
        "Ranked",
        getRankedOpportunities()
    );

    console.groupEnd();

}
