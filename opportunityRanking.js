// ==================== FILE: opportunityRanking.js ====================

function getRankedOpportunities() {

    const opportunities =
        getDetectedOpportunities();

    return opportunities.sort((a, b) => {

        const scoreA =
            Number(a.wealthImpact || 0);

        const scoreB =
            Number(b.wealthImpact || 0);

        return scoreB - scoreA;

    });

}
