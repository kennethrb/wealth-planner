function getRankedOpportunities() {

    const opportunities =
        getDetectedOpportunities();

    return opportunities
        .sort(
            (a, b) =>
                b.wealthImpact -
                a.wealthImpact
        );

}
