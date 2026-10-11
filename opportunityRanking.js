// ==================== FILE: opportunityRanking.js ====================

function getOpportunityScore(opportunity) {

    const impact =
        Number(opportunity.wealthImpact || 0);

    const confidence =
        Number(opportunity.confidence || 0);

    const priorityMap = {
        CRITICAL: 100,
        HIGH: 75,
        MEDIUM: 50,
        LOW: 25
    };

    const priority =
        priorityMap[
            opportunity.priority
        ] || 0;

    return (
        impact * 0.60 +
        confidence * 0.20 +
        priority * 0.20
    );

}

function getRankedOpportunities() {

    return getDetectedOpportunities()

        .map(item => ({
            ...item,
            score:
                getOpportunityScore(item)
        }))

        .sort(
            (a, b) =>
                b.score - a.score
        );

}
