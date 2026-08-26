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
              ${amount}
            </td>
          `;

        });

        html += `</tr>`;

      }

    });

  });

  html += `</table>`;

  container.innerHTML = html;

}



// ====================
// LOAD APP
// ====================

loadAccounts();
loadBudgetPlanner();
