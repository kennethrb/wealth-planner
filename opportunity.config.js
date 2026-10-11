// ==================== FILE: opportunity.config.js ====================

const OpportunityConfig = {

    scoring: {

        wealthImpact: 0.35,

        confidence: 0.15,

        priority: 0.15,

        protectionAlignment: 0.20,

        goalAcceleration: 0.15

    },

    thresholds: {

        minimumOpportunityImpact: 1000

    },
    
    priorityMap: {
    
        CRITICAL: 100,
    
        HIGH: 75,
    
        MEDIUM: 50,
    
        LOW: 25
    
    }

};
