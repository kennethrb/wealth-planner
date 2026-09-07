async function loadGoals() {
    const container = document.getElementById("financialGoals");
    if (!container) return;
    let html = `<div class="goals-container">`;
    appData.goals.forEach(goal => {
        const current = Number(goal.current || 0);
        const target = Number(goal.target || 1);
        const monthlyContribution =
            Number(goal.monthlyContribution);
        
        if (monthlyContribution <= 0) {
            // Show N/A forecast
        }
        const progress = ((current / target) * 100).toFixed(1);
        const remainingAmount = target - current;
        const monthsRemaining = Math.ceil(remainingAmount / monthlyContribution);
        const completionDate = new Date();
        completionDate.setMonth(completionDate.getMonth() + monthsRemaining);
        const forecast = completionDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short"
        });
        html += `
      <div class="goal-item">
        <div class="item-header">
          <span class="item-title">🎯 ${goal.goal}</span>
          <span class="item-value">${formatCurrency(current)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%;"></div>
        </div>
        <div class="goal-details">
          <span>Target: ${formatCurrency(target)} (${progress}%)</span>
          <span>Est: <strong>${forecast}</strong> (${monthsRemaining} mos)</span>
        </div>
      </div>
    `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

