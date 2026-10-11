// ==================== FILE: opportunityRanking.js ====================

function getOpportunityScore(
    opportunity
) {

    const context =
        getAdvisorContext();

    const weights =
        CONFIG.opportunity.scoring;

    const impact =
        Number(
            opportunity.wealthImpact || 0
        );

    const confidence =
        Number(
            opportunity.confidence || 0
        );

    const priority =
        CONFIG.opportunity.priorityMap[
            opportunity.priority
        ] || 0;

    let protectionAlignment = 100;

    if (
        context.liquidity.coverage <
        CONFIG.cashFlowDomain.cashFlow.minimumCoverage
    ) {
        protectionAlignment = 0;
    }

    let goalAcceleration = 0;

    if (
        opportunity.type ===
        OpportunityType.GOAL_COMPLETION
    ) {
        goalAcceleration = 100;
    }

    return (

        impact *
        weights.wealthImpact +

        confidence *
        weights.confidence +

        priority *
        weights.priority +

        protectionAlignment *
        weights.protectionAlignment +

        goalAcceleration *
        weights.goalAcceleration

    );

}

function getRankedOpportunities() {

    return getDetectedOpportunities()

        .map(item => ({
        
            ...item,
        
            score:
                Number(
                    getOpportunityScore(item)
                ).toFixed(2)
        
        }))

        .sort(
            (a, b) =>
                b.score - a.score
        );

}

function debugOpportunityScoring() {

    const opportunities =
        getDetectedOpportunities();

    return opportunities.map(item => ({

        title:
            item.title,

        type:
            item.type,

        priority:
            item.priority,

        confidence:
            item.confidence,

        wealthImpact:
            item.wealthImpact,

        score:
            getOpportunityScore(item)

    }));

}
