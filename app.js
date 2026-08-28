// Universal Philippine Peso Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const BASE_URL =
"https://script.google.com/macros/s/AKfycbwZGBobKrROvavAglc9QZlBmbSggBudqJBH6dT7LrkPopdZDQVbCZ4FWhE926f1Z_Y-NQ/exec";

let appData = {
  accounts: [],
  budget: [],
  categories: [],
  goals: []
};

function showStatus(
  message,
  type = "success"
) {

  const status =
    document.getElementById(
      "globalStatus"
    );

  if (!status) return;

  status.className =
    `status-banner ${type}`;

  status.innerHTML =
    message;

  status.style.display =
    "block";

  clearTimeout(
    status.timeoutId
  );

  status.timeoutId =
    setTimeout(() => {

      status.classList.add(
        "hide"
      );

      setTimeout(() => {

        status.style.display =
          "none";

        status.classList.remove(
          "hide"
        );

      }, 300);

    }, 4000);

}

// ====================
// ACCOUNTS (VISUAL MATCH TO GOALS)
// ====================
function loadAccounts() {
  const container = document.getElementById("accounts");
  if (!container) return;

  if (!appData.accounts || appData.accounts.length === 0) {
    container.innerHTML = `<div class="goal-item"><span class="label">No accounts found</span></div>`;
    return;
  }

  container.innerHTML = `
    <div class="goals-container">
      ${appData.accounts.map(account => {
        const name = account.name || account.accountName || 'Unnamed Account';
        const balance = Number(account.currentBalance || account.balance || 0);
        const type = account.netWorthType || 'Asset';

        return `
          <div class="goal-item">
            <div class="item-header">
              <span class="item-title">💳 ${name}</span>
              <span class="item-value">${formatCurrency(balance)}</span>
            </div>
            <div class="goal-details">
              <span>Type: <strong>${type}</strong></span>
              <span>Status: <strong class="${type === 'Asset' ? 'text-success' : 'text-danger'}">Active</strong></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function addCategory() {

  const categoryName =
    document.getElementById(
      "categoryName"
    ).value;

  const budgetType =
    document.getElementById(
      "budgetType"
    ).value;

  const group =
    document.getElementById(
      "categoryGroup"
    ).value;

  if (
    !categoryName ||
    !group
  ) {
  
    showStatus(
      "⚠ Please complete all fields.",
      "warning"
    );
  
    return;
  }
  
  const confirmed = confirm(
    `Add category "${categoryName}"?`
  );
  
  if (!confirmed) return;
  
  await fetch(
    `${BASE_URL}?action=addCategory`
    + `&categoryName=${encodeURIComponent(categoryName)}`
    + `&budgetType=${encodeURIComponent(budgetType)}`
    + `&group=${encodeURIComponent(group)}`
  );

  await loadData();

  await loadCategoryDropdown();
  await loadScenarioCategories();

  showStatus(
  `✅ Category ${categoryName} added successfully`,
  "success"
);

  document.getElementById(
    "categoryName"
  ).value = "";

  document.getElementById(
    "categoryGroup"
  ).value = "";

  document.getElementById(
    "budgetType"
  ).selectedIndex = 0;

}

async function loadCategoryDropdown() {

  const response =
    await fetch(
      `${BASE_URL}?action=getCategories`
    );

  const categories =
    await response.json();

  const addSelect =
    document.getElementById(
      "newCategory"
    );

  const deleteSelect =
    document.getElementById(
      "deleteCategorySelect"
    );

  if (addSelect)
    addSelect.innerHTML = "";

  if (deleteSelect)
    deleteSelect.innerHTML = "";

  categories.forEach(cat => {

    if (addSelect) {

      addSelect.innerHTML += `
        <option value="${cat.categoryName}">
          ${cat.categoryName}
        </option>
      `;

    }

    if (deleteSelect) {

      deleteSelect.innerHTML += `
        <option value="${cat.categoryName}">
          ${cat.categoryName}
        </option>
      `;

    }

  });

}

function loadYearDropdown() {

  const dropdown =
    document.getElementById(
      "budgetYear"
    );

  if (!dropdown) return;

  const years =
    [...new Set(
      appData.budget.map(
        item => item.year
      )
    )];

  years.sort();

  dropdown.innerHTML = years
    .map(year =>
      `<option value="${year}">
        ${year}
      </option>`
    )
    .join("");
}

function getSelectedYear() {

  return Number(
    document.getElementById(
      "budgetYear"
    )?.value
  );

}

// ====================
// CATEGORIES
// ====================

async function deleteCategory() {
  const categoryName = document.getElementById("deleteCategorySelect").value;

  if (!categoryName) return;

  // Confirmation prompt before deletion
  const confirmDelete = confirm(`Are you sure you want to delete the category "${categoryName}"? This cannot be undone.`);
  if (!confirmDelete) return;

  await fetch(
    `${BASE_URL}?action=deleteCategory` +
    `&categoryName=${encodeURIComponent(categoryName)}`
  );

  await loadData();
  await loadCategoryDropdown();
  await loadScenarioCategories();

  showStatus(
  `🗑 Category ${categoryName} deleted`,
  "success"
);
}

async function addBudgetItem() {

  

  const year =
    document.getElementById(
      "newYear"
    ).value;

  const month =
    document.getElementById(
      "newMonth"
    ).value;

  const category =
    document.getElementById(
      "newCategory"
    ).value;

  const amount =
    document.getElementById(
      "newAmount"
    ).value;

  if (
  !amount ||
  Number(amount) <= 0
  ) {
  
    showStatus(
  "⚠ Amount must be greater than zero",
  "warning"
);
  
    return;
  
  }

  const confirmed = confirm(
    `Add budget item "${category}" for ${month} ${year}?`
  );
  
  if (!confirmed) return;

  await fetch(

    `${BASE_URL}?action=addBudgetItem`

    + `&year=${year}`
    + `&month=${month}`
    + `&category=${encodeURIComponent(category)}`
    + `&amount=${amount}`

  );

  await loadData();

  await Promise.all([
    loadBudgetPlanner(),
    loadSummary(),
    loadDashboard()
  ]);

  const status =
    document.getElementById(
      "globalStatus"
    );

  showStatus(
  "✅ Budget Item Added",
  "success"
);

}

// ====================
// BUDGET PLANNER
// ====================

async function deleteBudgetItem(category) {
  // Confirmation prompt before row deletion
  const confirmed = confirm(`Are you sure you want to delete all budget entries for "${category}"?`);
  if (!confirmed) return;

  await fetch(
    `${BASE_URL}?action=deleteBudgetItem` +
    `&category=${encodeURIComponent(category)}`
  );

  await loadData();

  await Promise.all([
    loadBudgetPlanner(),
    loadSummary(),
    loadDashboard(),
    loadProjection()
  ]);

  showStatus(
  `🗑 Deleted ${category}`,
  "success"
);
}

// ====================
// BUDGET PLANNER
// ====================

async function loadBudgetPlanner() {
  const selectedYear =
    Number(
      document.getElementById(
        "budgetYear"
      )?.value
    ) ||
    Math.min(
      ...appData.budget.map(
        item => item.year
      )
    );
  
  const budgetData =
    appData.budget.filter(
      item =>
        Number(item.year) ===
        selectedYear
    );
  const categoryData = appData.categories;

  const months = [];
  const categories = {};
  const categoryTypes = {};

  categoryData.forEach(cat => {
    categoryTypes[cat.categoryName] = cat.budgetType;
  });

  budgetData.forEach(item => {
    if (!months.includes(item.month)) {
      months.push(item.month);
    }
    if (!categories[item.category]) {
      categories[item.category] = {};
    }
    categories[item.category][item.month] = Number(item.plannedAmount);
  });

  const container = document.getElementById("budget");

  // Wrap ONLY the table inside the scrollable container
  let html = `
    <div class="table-responsive">
      <table>
        <tr>
          <th>Category</th>
  `;

  months.forEach(month => {
    html += `<th>${month}</th>`;
  });

  html += `</tr>`;

  const sections = ["Income", "Expense", "Savings", "Debt"];

  sections.forEach(section => {
    // Dynamic CSS class mapping for custom section colors
    const sectionClass = `section-${section.toLowerCase()}`;

    html += `
      <tr class="${sectionClass}">
        <td colspan="${months.length + 1}">
          <strong>${section.toUpperCase()}</strong>
        </td>
      </tr>
    `;

    Object.keys(categories).forEach(category => {
      if (categoryTypes[category] === section) {
        html += `
          <tr style="height: 38px;">
            <td style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>${category}</span>
              <span 
                onclick="deleteBudgetItem('${category}')" 
                style="cursor: pointer; opacity: 0.5; font-size: 12px;"
                title="Delete row"
                onmouseover="this.style.opacity=1" 
                onmouseout="this.style.opacity=0.5">
                ✕
              </span>
            </td>
        `;

        months.forEach(month => {
          const amount = categories[category][month] || "";
          html += `
            <td>
              <input
                type="number"
                value="${amount}"
                id="${category}|${month}"
              >
            </td>
          `;
        });

        html += `</tr>`;
      }
    });
  });

  // Close table and table-responsive wrapper before action buttons
  const years =
    [...new Set(
      appData.budget.map(
        item => Number(item.year)
      )
    )];
  
  const currentYear =
    Math.max(...years);
  
  const nextYear =
    currentYear + 1;
  
  html += `
      </table>
    </div>
    <div class="action-buttons">
      <button onclick="saveBudgetChanges()">💾 Save Changes</button>
      <button onclick="copyJanuaryToWholeYear()">📋 Copy Jan → Whole Year</button>
      <button onclick="copyCurrentYearToNextYear()">📅 Copy ${currentYear} → ${nextYear}</button>
    </div>
    <span id="saveStatus" style="display: block; text-align: center; margin-top: 8px;"></span>
  `;

  container.innerHTML = html;
}

async function loadSummary() {

  const selectedYear =
    getSelectedYear();

  const budgetData =
    appData.budget.filter(
      item =>
        Number(item.year) ===
        selectedYear
    );
  const categoryData = appData.categories;

  const categoryTypes = {};
  categoryData.forEach(cat => {
    categoryTypes[cat.categoryName] = cat.budgetType;
  });

  const monthlyTotals = {};

  budgetData.forEach(item => {
    const month = item.month;
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = { Income: 0, Expense: 0, Savings: 0, Debt: 0 };
    }

    const type = categoryTypes[item.category];
    if (type) {
      monthlyTotals[month][type] += Number(item.plannedAmount);
    }
  });

  let html = `
    <table>
      <tr>
        <th>Month</th>
        <th class="col-income">Income</th>
        <th class="col-expense">Expense</th>
        <th class="col-savings">Savings</th>
        <th class="col-debt">Debt</th>
        <th>Remaining</th>
      </tr>
  `;

  Object.keys(monthlyTotals).forEach(month => {
    const income = monthlyTotals[month].Income;
    const expense = monthlyTotals[month].Expense;
    const savings = monthlyTotals[month].Savings;
    const debt = monthlyTotals[month].Debt;
    const remaining = income - expense - savings - debt;

    html += `
      <tr>
        <td>${month}</td>
        <td class="col-income">₱${income.toLocaleString()}</td>
        <td class="col-expense">₱${expense.toLocaleString()}</td>
        <td class="col-savings">₱${savings.toLocaleString()}</td>
        <td class="col-debt">₱${debt.toLocaleString()}</td>
        <td>₱${remaining.toLocaleString()}</td>
      </tr>
    `;
  });

  html += `</table>`;
  document.getElementById("summary").innerHTML = html;
}

async function loadDashboard() {

  const selectedYear =
  getSelectedYear();

  const budgetData =
    appData.budget.filter(
      item =>
        Number(item.year) ===
        selectedYear
    );
  
  const categoryData =
    appData.categories;

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

    if (item.month !== "Jan")
      return;

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
    ((savings / income) * 100)
      .toFixed(1);

  const debtRate =
    ((debt / income) * 100)
      .toFixed(1);

  document.getElementById(
    "dashboard"
  ).innerHTML = `

    <div class="card">

      <h2>
        💰 Financial Health
      </h2>

      <div class="metric-row">
        <span>Monthly Surplus</span>
        <strong>
          ₱${Math.round(remaining).toLocaleString()}
        </strong>
      </div>

      <div class="metric-row">
        <span>Annual Surplus</span>
        <strong>
          ₱${Math.round(annualSurplus).toLocaleString()}
        </strong>
      </div>

      <div class="metric-row">
        <span>Savings Rate</span>
        <strong>
          ${savingsRate}%
        </strong>
      </div>

      <div class="metric-row">
        <span>Debt Rate</span>
        <strong>
          ${debtRate}%
        </strong>
      </div>

      <div class="metric-row">
        <span>Status</span>
        <strong>
          ${
            remaining > 0
            ? "✅ Positive Cash Flow"
            : "❌ Negative Cash Flow"
          }
        </strong>
      </div>

    </div>

  `;
}

// ====================
// GOALS (UPDATED)
// ====================
async function loadGoals() {
  const goals = appData.goals;
  const container = document.getElementById("goals");

  let html = `<div class="goals-container">`;

  goals.forEach(goal => {
    const progress = ((goal.current / goal.target) * 100).toFixed(1);
    const remainingAmount = goal.target - goal.current;
    const monthsRemaining = Math.ceil(remainingAmount / goal.monthlyContribution);

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
          <span class="item-value">₱${Number(goal.current).toLocaleString()}</span>
        </div>
        
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%;"></div>
        </div>

        <div class="goal-details">
          <span>Target: ₱${Number(goal.target).toLocaleString()} (${progress}%)</span>
          <span>Est: <strong>${forecast}</strong> (${monthsRemaining} mos)</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ====================
// NET WORTH HERO BANNER (DYNAMIC)
// ====================
async function loadNetWorth() {
  const accounts = appData.accounts;

  let assets = 0;
  let liabilities = 0;

  accounts.forEach(account => {
    const balance = Number(account.currentBalance || account.balance || 0);

    if (account.netWorthType === "Asset") {
      assets += balance;
    }

    if (account.netWorthType === "Liability") {
      liabilities += balance;
    }
  });

  const netWorth = assets - liabilities;
  const isNegative = netWorth < 0;

  document.getElementById("networth").innerHTML = `
    <div class="networth-banner ${isNegative ? 'negative' : 'positive'}">
      <h2>💎 Net Worth</h2>
      <div class="big-amount">${formatCurrency(netWorth)}</div>
      
      <div class="networth-details">
        <span>Assets: <strong>${formatCurrency(assets)}</strong></span>
        <span>Liabilities: <strong>${formatCurrency(liabilities)}</strong></span>
      </div>
    </div>
  `;
}

async function loadProjection() {

  const accounts =
  appData.accounts;

  const selectedYear =
  getSelectedYear();

  const budgetData =
    appData.budget.filter(
      item =>
        Number(item.year) ===
        selectedYear
    );
  
  const categories =
    appData.categories;

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

  document.getElementById(
  "projection"
).innerHTML = `

<div class="card">

  <h2>
    📈 Wealth Projection
  </h2>

  <div class="metric-row">
    <span>Current Assets</span>
    <strong>
      ₱${Math.round(assets).toLocaleString()}
    </strong>
  </div>

  <div class="metric-row">
    <span>Current Net Worth</span>
    <strong>
      ₱${Math.round(
        assets - liabilities
      ).toLocaleString()}
    </strong>
  </div>

  <hr>

  <div class="metric-row">
    <span>Projected Assets</span>
    <strong>
      ₱${Math.round(
        projectedAssets
      ).toLocaleString()}
    </strong>
  </div>

  <div class="metric-row">
    <span>Projected Net Worth</span>
    <strong>
      ₱${Math.round(
        projectedNetWorth
      ).toLocaleString()}
    </strong>
  </div>

</div>

`;

}

// ====================
// FUNDING BREAKDOWN (GROUP TYPE = CASH)
// ====================
function loadFundingPlan() {
  const selectedYear =
  getSelectedYear();
  const container = document.getElementById("fundingPlanList");
  const cashContainer = document.getElementById("cashToWithdraw");
  if (!container || !appData.budget || !appData.categories) return;

  // Create lookup maps for category properties
  const categoryTypes = {};
  const categoryGroups = {};

  appData.categories.forEach(cat => {
    categoryTypes[cat.categoryName] = cat.budgetType;
    categoryGroups[cat.categoryName] = cat.group; // Map category group
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavings = 0;
  let totalDebt = 0;
  let cashToWithdraw = 0;

  // Calculate totals for January (or baseline month)
  appData.budget
    .filter(
      item =>
        Number(item.year) ===
        selectedYear
    )
    .forEach(item => {
    if (item.month !== "Jan") return;

    const type = categoryTypes[item.category];
    const group = categoryGroups[item.category];
    const amount = Number(item.plannedAmount) || 0;

    if (type === "Income") totalIncome += amount;
    if (type === "Expense") totalExpense += amount;
    if (type === "Savings") totalSavings += amount;
    if (type === "Debt") totalDebt += amount;

    // Sum items where Group is explicitly "Cash"
    if (group === "Cash") {
      cashToWithdraw += amount;
    }
  });

  // Update banner display with total Cash required
  if (cashContainer) {
    cashContainer.textContent = formatCurrency(cashToWithdraw);
  }

  // Render rows
  container.innerHTML = `
    <div class="funding-row">
      <span class="label">Total Monthly Income</span>
      <span class="amount">${formatCurrency(totalIncome)}</span>
    </div>
    <div class="funding-row">
      <span class="label">Total Expenses</span>
      <span class="amount">${formatCurrency(totalExpense)}</span>
    </div>
    <div class="funding-row">
      <span class="label">Total Savings</span>
      <span class="amount">${formatCurrency(totalSavings)}</span>
    </div>
    <div class="funding-row">
      <span class="label">Total Debt Payments</span>
      <span class="amount">${formatCurrency(totalDebt)}</span>
    </div>
    <div class="funding-row highlight">
      <span class="label">Cash Requirements</span>
      <span class="amount">${formatCurrency(cashToWithdraw)}</span>
    </div>
  `;
}


async function copyJanuaryToWholeYear() {

  const confirmed = confirm(
  "Copy January budget amounts to all other months?"
  );
  
  if (!confirmed) return;

  await fetch(
  `${BASE_URL}?action=copyJanuaryToWholeYear`
  );
  
  await new Promise(
    resolve => setTimeout(resolve, 2000)
  );

  await loadData();

  console.log(
  "Budget rows:",
  appData.budget.length
  );
  
  console.log(
    appData.budget.slice(0, 10)
  );

  await loadData();

  await loadBudgetPlanner();
  await loadSummary();
  await loadDashboard();
  await loadProjection();
  await loadGoals();
  await loadNetWorth();
  await loadFundingPlan();

  const status =
    document.getElementById(
      "globalStatus"
    );

  if (status) {

    showStatus(
  "✅ January copied to all months",
  "success"
);

  }

}

async function copyCurrentYearToNextYear() {

  const confirmed = confirm(
    "Create the next budget year using the latest year's values?"
  );
  
  if (!confirmed) return;

  const response =
    await fetch(
      `${BASE_URL}?action=copyCurrentYearToNextYear`
    );

  const result =
    await response.json();

  await loadData();

  if (result.success) {

    showStatus(
      `✅ ${result.nextYear} budget created`,
      "success"
    );

  } else {

    showStatus(
      result.message ||
      "❌ Failed to create next year budget",
      "error"
    );

  }

}


async function saveBudgetChanges() {
  // Optional safety check when overwriting/saving budget changes
  const confirmed = confirm("Are you sure you want to save all changes to the budget?");
  if (!confirmed) return;

  const inputs = document.querySelectorAll("#budget input[type='number']");
  const budgetItems = [];

  inputs.forEach(input => {
    const [category, month] = input.id.split("|");
    const selectedYear =
      Number(
        document.getElementById(
          "budgetYear"
        ).value
      );
    
    budgetItems.push({
      year: selectedYear,
      month: month,
      category: category,
      amount: input.value
    });
  });

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "saveAllBudgets",
        budgetItems: budgetItems
      })
    });

    const result = await response.json();

    if (result.success) {
      await loadData();
      await Promise.all([
        loadBudgetPlanner(),
        loadSummary(),
        loadDashboard(),
        loadProjection(),
        loadGoals(),
        loadNetWorth(),
        loadFundingPlan()
      ]);

      showStatus(
  `✅ ${budgetItems.length} items saved successfully at ${new Date().toLocaleTimeString()}`,
  "success"
);
    } else {
      showStatus(
  "❌ Failed to save budget changes.",
  "error"
);
    }
  } catch (error) {
    console.error("Save error:", error);
    showStatus(
  "❌ Error saving budget changes.",
  "error"
);
  }
}

async function loadData() {

  const [
    accounts,
    budget,
    categories,
    goals
  ] = await Promise.all([

    fetch(
      `${BASE_URL}?action=getAccounts`
    ).then(r => r.json()),

    fetch(
      `${BASE_URL}?action=getBudgetPlan`
    ).then(r => r.json()),

    fetch(
      `${BASE_URL}?action=getCategories`
    ).then(r => r.json()),

    fetch(
      `${BASE_URL}?action=getGoals`
    ).then(r => r.json())

  ]);

  appData.accounts = accounts;
  appData.budget = budget;
  appData.categories = categories;
  appData.goals = goals;

}

async function loadScenarioCategories() {

  const dropdown =
    document.getElementById(
      "scenarioCategory"
    );

  if (!dropdown) return;

  dropdown.innerHTML = "";

  appData.categories.forEach(cat => {

    dropdown.innerHTML += `
      <option
        value="${cat.categoryName}"
      >
        ${cat.categoryName}
      </option>
    `;

  });

}

function getCurrentAmount(category) {

  const selectedYear =
  getSelectedYear();

  const item =
    appData.budget.find(row =>
      Number(row.year) === selectedYear &&
      row.category === category &&
      row.month === "Jan"
    );

  return item
    ? Number(item.plannedAmount)
    : 0;

}

function runScenario() {

  const category =
    document.getElementById(
      "scenarioCategory"
    ).value;

  const scenarioAmount =
    Number(
      document.getElementById(
        "scenarioAmount"
      ).value
    );

  const currentAmount =
    getCurrentAmount(category);

  const difference =
    scenarioAmount - currentAmount;

  const categoryInfo =
  appData.categories.find(
    c =>
      c.categoryName === category
  );

  const budgetType =
    categoryInfo
      ? categoryInfo.budgetType
      : "";

  let income = 0;
  let expense = 0;
  let savings = 0;
  let debt = 0;

const selectedYear =
  getSelectedYear();

appData.budget
  .filter(item =>
    Number(item.year) === selectedYear
  )
  .forEach(item => {

  if (item.month !== "Jan")
    return;

  const cat =
    appData.categories.find(
      c =>
        c.categoryName === item.category
    );

  if (!cat) return;

  const amount =
    Number(item.plannedAmount);

  if (
    cat.budgetType === "Income"
  )
    income += amount;

  if (
    cat.budgetType === "Expense"
  )
    expense += amount;

  if (
    cat.budgetType === "Savings"
  )
    savings += amount;

  if (
    cat.budgetType === "Debt"
  )
    debt += amount;

});

  const currentSurplus =
  income -
  expense -
  savings -
  debt;

  let scenarioSurplus =
  currentSurplus;

if (budgetType === "Income") {

  scenarioSurplus +=
    difference;

}

if (
  budgetType === "Expense"
) {

  scenarioSurplus -=
    difference;

}

if (
  budgetType === "Savings"
) {

  scenarioSurplus -=
    difference;

}

if (
  budgetType === "Debt"
) {

  scenarioSurplus -=
    difference;

}

  const annualDifference =
  (scenarioSurplus - currentSurplus) * 12;

  const assets =
  appData.accounts
    .filter(
      a =>
        a.netWorthType === "Asset"
    )
    .reduce(
      (sum, a) =>
        sum +
        Number(a.currentBalance),
      0
    );

  const liabilities =
    appData.accounts
      .filter(
        a =>
          a.netWorthType === "Liability"
      )
      .reduce(
        (sum, a) =>
          sum +
          Number(a.currentBalance),
        0
      );

  const currentProjectedNetWorth =
  assets +
  (currentSurplus * 12) -
  liabilities;

  const scenarioProjectedNetWorth =
    assets +
    (scenarioSurplus * 12) -
    liabilities;
  
  const netWorthDifference =
    scenarioProjectedNetWorth -
    currentProjectedNetWorth;

  document.getElementById(
    "scenarioResult"
  ).innerHTML = `

    <div class="card">

      <h3>
        Scenario Result
      </h3>

      <p>
        Category:
        <strong>
          ${category}
        </strong>
      </p>

      <p>
        Current Amount:
        <strong>
          ₱${currentAmount.toLocaleString()}
        </strong>
      </p>

      <p>
        Scenario Amount:
        <strong>
          ₱${scenarioAmount.toLocaleString()}
        </strong>
      </p>

      <p>
  Difference:
  <strong>
    ₱${difference.toLocaleString()}
  </strong>
      </p>
      
      <hr>
      
      <p>
        Current Monthly Surplus:
        <strong>
          ₱${currentSurplus.toLocaleString()}
        </strong>
      </p>
      
      <p>
        Scenario Monthly Surplus:
        <strong>
          ₱${scenarioSurplus.toLocaleString()}
        </strong>
      </p>

      <p>
        Annual Impact:
        <strong>
          ₱${annualDifference.toLocaleString()}
        </strong>
      </p>

      <hr>

      <p>
        Current Projected Net Worth:
        <strong>
          ₱${currentProjectedNetWorth.toLocaleString()}
        </strong>
      </p>
      
      <p>
        Scenario Projected Net Worth:
        <strong>
          ₱${scenarioProjectedNetWorth.toLocaleString()}
        </strong>
      </p>
      
      <p>
        Net Worth Impact:
        <strong>
          ₱${netWorthDifference.toLocaleString()}
        </strong>
      </p>

    </div>

  `;

}

async function changeBudgetYear() {

  await Promise.all([
    loadBudgetPlanner(),
    loadSummary(),
    loadDashboard(),
    loadProjection(),
    loadFundingPlan()
  ]);

}


// ====================
// LOAD APP
// ====================
async function initializeApp() {

  await loadData();
  loadYearDropdown();

  await Promise.all([
  loadNetWorth(),
  loadProjection(),
  loadDashboard(),
  loadGoals(),
  loadAccounts(),
  loadBudgetPlanner(),
  loadSummary(),
  loadFundingPlan()
]);

  loadCategoryDropdown();

  loadScenarioCategories();

}

initializeApp();
