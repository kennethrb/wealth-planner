// ==================== FILE: opportunityRanking.js ====================

function getRankedOpportunities() {

    return getDetectedOpportunities()

        .sort(

            (a, b) =>

                Number(b.wealthImpact || 0)

                -

                Number(a.wealthImpact || 0)

        );

}
