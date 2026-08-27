const BASE_URL =
"https://script.google.com/macros/s/AKfycbwZGBobKrROvavAglc9QZlBmbSggBudqJBH6dT7LrkPopdZDQVbCZ4FWhE926f1Z_Y-NQ/exec";


// ====================
// ACCOUNTS
// ====================

async function loadAccounts() {

  const response =
    await fetch(
      `${BASE_URL}?action=getAccounts`
    );

  const data =
    await response.json();

  const container =
    document.getElementById("accounts");

  let html = "";

  data.forEach(account => {

    html += `
      <div class="card">

        <div class="account-name">
          ${account.accountName}
        </div>

        <div class="balance">
          Balance: ₱${Number(account.currentBalance).toLocaleString()}
        </div>

      </div>
    `;

  });

  container.innerHTML = html;

}



// ====================
// BUDGET PLANNER
// ====================

async function loadBudgetPlanner() {

  const budgetResponse =
    await fetch(
      `${BASE_URL}?action=getBudgetPlan`
    );

  const categoryResponse =
    await fetch(
      `${BASE_URL}?action=getCategories`
    );

  const budgetData =
    await budgetResponse.json();

  const categoryData =
    await categoryResponse.json();

  const months = [];
  const categories = {};
  const categoryTypes = {};

  // Store category types

  categoryData.forEach(cat => {

    categoryTypes[cat.categoryName] =
      cat.budgetType;

  });

  // Build planner structure

  budgetData.forEach(item => {

    if (!months.includes(item.month)) {
      months.push(item.month);
    }

    if (!categories[item.category]) {
      categories[item.category] = {};
    }

    categories[item.category][item.month] =
      Number(item.plannedAmount);

  });

  const container =
    document.getElementById("budget");

  let html = `
    <table border="1" cellpadding="8" cellspacing="0">

      <tr>
        <th>Category</th>
  `;

  months.forEach(month => {
    html += `<th>${month}</th>`;
  });

  html += `</tr>`;

  const sections = [
    "Income",
    "Expense",
    "Savings",
    "Debt"
  ];

  sections.forEach(section => {

    html += `
      <tr style="background:#dff0d8;">
        <td colspan="${months.length + 1}">
          <strong>${section.toUpperCase()}</strong>
        </td>
      </tr>
    `;

    Object.keys(categories).forEach(category => {

      if (
        categoryTypes[category] === section
      ) {

        html += `
          <tr>
            <td>${category}</td>
        `;

        months.forEach(month => {

          const amount =
            categories[category][month] || "";

          html += `
          <td>
          
          <input
            type="number"
            value="${amount}"
            id="${category}|${month}"
            style="
              width:90px;
              text-align:right;
            "
          >
          
          </td>
          `;

        });

        html += `</tr>`;

      }

    });

  });

  html += `
  </table>
  
  <br>
  
  <button onclick="saveBudgetChanges()">
  💾 Save Changes
  </button>
  
  <button onclick="copyJanuaryToWholeYear()">
    📋 Copy Jan → Whole Year
  </button>

  
  <span id="saveStatus"
        style="margin-left:10px;">
  </span>
  `;

  container.innerHTML = html;

}

async function loadSummary() {

  const budgetResponse =
    await fetch(
      `${BASE_URL}?action=getBudgetPlan`
    );

  const categoryResponse =
    await fetch(
      `${BASE_URL}?action=getCategories`
    );

  const budgetData =
    await budgetResponse.json();

  const categoryData =
    await categoryResponse.json();

  const categoryTypes = {};

  categoryData.forEach(cat => {
    categoryTypes[cat.categoryName] =
      cat.budgetType;
  });

  const monthlyTotals = {};

  budgetData.forEach(item => {

    const month = item.month;

    if (!monthlyTotals[month]) {

      monthlyTotals[month] = {
        Income: 0,
        Expense: 0,
        Savings: 0,
        Debt: 0
      };

    }

    const type =
      categoryTypes[item.category];

    if (type) {

      monthlyTotals[month][type] +=
        Number(item.plannedAmount);

    }

  });

  let html = `

    <table border="1" cellpadding="8" cellspacing="0">

      <tr>
        <th>Month</th>
        <th>Income</th>
        <th>Expense</th>
        <th>Savings</th>
        <th>Debt</th>
        <th>Remaining</th>
      </tr>

  `;

  Object.keys(monthlyTotals).forEach(month => {

    const income =
      monthlyTotals[month].Income;

    const expense =
      monthlyTotals[month].Expense;

    const savings =
      monthlyTotals[month].Savings;

    const debt =
      monthlyTotals[month].Debt;

    const remaining =
      income - expense - savings - debt;

    html += `
      <tr>

        <td>${month}</td>

        <td>₱${income.toLocaleString()}</td>

        <td>₱${expense.toLocaleString()}</td>

        <td>₱${savings.toLocaleString()}</td>

        <td>₱${debt.toLocaleString()}</td>

        <td>
          ₱${remaining.toLocaleString()}
        </td>

      </tr>
    `;

  });

  html += `</table>`;

  document.getElementById("summary")
    .innerHTML = html;

}

async function loadDashboard() {

  const budgetResponse =
    await fetch(
      `${BASE_URL}?action=getBudgetPlan`
    );

  const categoryResponse =
    await fetch(
      `${BASE_URL}?action=getCategories`
    );

  const budgetData =
    await budgetResponse.json();

  const categoryData =
    await categoryResponse.json();

  const categoryTypes = {};

  categoryData.forEach(cat => {

    categoryTypes[cat.categoryName] =
      cat.budgetType;

  });

  let income = 0;
  let expense = 0;
  let savings = 0;
  let debt = 0;

  budgetData.forEach(item => {

    if (item.month !== "Jan") return;

    const type =
      categoryTypes[item.category];

    const amount =
      Number(item.plannedAmount);

    if (type === "Income")
      income += amount;

    if (type === "Expense")
      expense += amount;

    if (type === "Savings")
      savings += amount;

    if (type === "Debt")
      debt += amount;

  });

  const remaining =
    income - expense - savings - debt;

  const annualSurplus =
    remaining * 12;

  const savingsRate =
    ((savings / income) * 100).toFixed(1);

  const debtRate =
    ((debt / income) * 100).toFixed(1);

  const dashboard =
    document.getElementById("dashboard");

  dashboard.innerHTML = `

    <div class="card">

      <h2>💰 Financial Health</h2>

      <p>
        Monthly Surplus:
        <strong>
          ₱${remaining.toLocaleString()}
        </strong>
      </p>

      <p>
        Annual Surplus:
        <strong>
          ₱${annualSurplus.toLocaleString()}
        </strong>
      </p>

      <p>
        Savings Rate:
        <strong>
          ${savingsRate}%
        </strong>
      </p>

      <p>
        Debt Rate:
        <strong>
          ${debtRate}%
        </strong>
      </p>

      <p>
        Status:
        <strong>
          ${remaining > 0
            ? "✅ Positive Cash Flow"
            : "❌ Negative Cash Flow"}
        </strong>
      </p>

    </div>
  `;

}

async function loadGoals() {

  const response =
    await fetch(
      `${BASE_URL}?action=getGoals`
    );

  const goals =
    await response.json();

  let html = "";

  goals.forEach(goal => {

    const progress =
      (
        (goal.current / goal.target) * 100
      ).toFixed(1);

    const remainingAmount =
      goal.target - goal.current;

    const monthsRemaining =
      Math.ceil(
        remainingAmount /
        goal.monthlyContribution
      );

    const completionDate =
      new Date();

    completionDate.setMonth(
      completionDate.getMonth() +
      monthsRemaining
    );

    const forecast =
      completionDate.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long"
        }
      );

    html += `

      <div class="card">

        <h3>
          🎯 ${goal.goal}
        </h3>

        <p>
          Current:
          ₱${Number(goal.current)
            .toLocaleString()}
        </p>

        <p>
          Target:
          ₱${Number(goal.target)
            .toLocaleString()}
        </p>

        <p>
          Progress:
          ${progress}%
        </p>

        <progress
          value="${goal.current}"
          max="${goal.target}">
        </progress>

        <p>
          Monthly Contribution:
          ₱${Number(goal.monthlyContribution)
            .toLocaleString()}
        </p>

        <p>
          Months Remaining:
          ${monthsRemaining}
        </p>

        <p>
          Estimated Completion:
          <strong>
            ${forecast}
          </strong>
        </p>

      </div>

    `;

  });

  document.getElementById("goals")
    .innerHTML = html;

}

async function loadNetWorth() {

  const response =
    await fetch(
      `${BASE_URL}?action=getAccounts`
    );

  const accounts =
    await response.json();

  let assets = 0;
  let liabilities = 0;

  accounts.forEach(account => {

    const balance =
      Number(account.currentBalance);

    if (
      account.netWorthType === "Asset"
    ) {

      assets += balance;

    }

    if (
      account.netWorthType === "Liability"
    ) {

      liabilities += balance;

    }

  });

  const netWorth =
    assets - liabilities;

  document.getElementById("networth")
    .innerHTML = `

      <div class="card">

        <h2>💎 Net Worth</h2>

        <p>
          Assets:
          <strong>
            ₱${assets.toLocaleString()}
          </strong>
        </p>

        <p>
          Liabilities:
          <strong>
            ₱${liabilities.toLocaleString()}
          </strong>
        </p>

        <p>
          Net Worth:
          <strong>
            ₱${netWorth.toLocaleString()}
          </strong>
        </p>

      </div>

    `;

}

async function loadProjection() {

  const accountsResponse =
    await fetch(
      `${BASE_URL}?action=getAccounts`
    );

  const budgetResponse =
    await fetch(
      `${BASE_URL}?action=getBudgetPlan`
    );

  const categoryResponse =
    await fetch(
      `${BASE_URL}?action=getCategories`
    );

  const accounts =
    await accountsResponse.json();

  const budgetData =
    await budgetResponse.json();

  const categories =
    await categoryResponse.json();

  const categoryTypes = {};

  categories.forEach(cat => {

    categoryTypes[cat.categoryName] =
      cat.budgetType;

  });

  let assets = 0;
  let liabilities = 0;

  accounts.forEach(account => {

    const balance =
      Number(account.currentBalance);

    if (
      account.netWorthType === "Asset"
    ) {
      assets += balance;
    }

    if (
      account.netWorthType === "Liability"
    ) {
      liabilities += balance;
    }

  });

  let income = 0;
  let expense = 0;
  let savings = 0;
  let debt = 0;

  budgetData.forEach(item => {

    if (item.month !== "Jan") return;

    const amount =
      Number(item.plannedAmount);

    const type =
      categoryTypes[item.category];

    if (type === "Income")
      income += amount;

    if (type === "Expense")
      expense += amount;

    if (type === "Savings")
      savings += amount;

    if (type === "Debt")
      debt += amount;

  });

  const monthlySurplus =
    income - expense - savings - debt;

  const annualSurplus =
    monthlySurplus * 12;

  const projectedAssets =
    assets + annualSurplus;

  const projectedNetWorth =
    projectedAssets - liabilities;

  document.getElementById("projection")
    .innerHTML = `

      <div class="card">

        <h2>📈 Wealth Projection</h2>

        <p>
          Current Assets:
          <strong>
            ₱${assets.toLocaleString()}
          </strong>
        </p>

        <p>
          Current Net Worth:
          <strong>
            ₱${(assets - liabilities).toLocaleString()}
          </strong>
        </p>

        <hr>

        <p>
          Projected Assets (12 Months):
          <strong>
            ₱${projectedAssets.toLocaleString()}
          </strong>
        </p>

        <p>
          Projected Net Worth:
          <strong>
            ₱${projectedNetWorth.toLocaleString()}
          </strong>
        </p>

      </div>

    `;

}

// ====================
// LOAD APP
// ====================
loadNetWorth();
loadProjection();
loadDashboard();
loadGoals();
loadAccounts();
loadBudgetPlanner();
loadSummary();

async function copyJanuaryToWholeYear() {

  await fetch(
    `${BASE_URL}?action=copyJanuaryToWholeYear`
  );

  await loadBudgetPlanner();
  await loadSummary();
  await loadDashboard();
  await loadProjection();
  await loadGoals();
  await loadNetWorth();

  const status =
    document.getElementById(
      "globalStatus"
    );

  if (status) {

    status.innerHTML =
      "✅ January copied to all months";

  }

}

async function saveBudgetChanges() {

  const inputs =
    document.querySelectorAll(
      "input[type='number']"
    );

  let saveCount = 0;

  for (const input of inputs) {

    const [category, month] =
      input.id.split("|");

    const amount =
      input.value;

    const url =
      `${BASE_URL}?action=saveBudget`
      + `&year=2027`
      + `&month=${month}`
      + `&category=${encodeURIComponent(category)}`
      + `&amount=${amount}`;

    try {

      await fetch(url);

      saveCount++;

    } catch(error) {

      console.error(error);

    }

  }

  await Promise.all([
  loadBudgetPlanner(),
  loadSummary(),
  loadDashboard(),
  loadProjection(),
  loadGoals(),
  loadNetWorth()
]);

  const status =
    document.getElementById(
      "globalStatus"
    );

  if (status) {

    status.innerHTML =
      `✅ ${saveCount} budget items saved at ${new Date().toLocaleTimeString()}`;

    status.style.color = "green";
    status.style.fontWeight = "bold";

  }

}

