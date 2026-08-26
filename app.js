const BASE_URL =
"https://script.google.com/macros/s/AKfycbwZGBobKrROvavAglc9QZlBmbSggBudqJBH6dT7LrkPopdZDQVbCZ4FWhE926f1Z_Y-NQ/exec";

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


async function loadBudget() {

  const response =
    await fetch(
      `${BASE_URL}?action=getBudgetPlan`
    );

  const data =
    await response.json();

  const months = [];

  const categories = {};

  data.forEach(item => {

    if (!months.includes(item.month)) {
      months.push(item.month);
    }

    if (!categories[item.category]) {
      categories[item.category] = {};
    }

    categories[item.category][item.month] =
      item.plannedAmount;

  });

  let html = `

    <table border="1" cellpadding="8" cellspacing="0">

      <tr>
        <th>Category</th>
  `;

  months.forEach(month => {
    html += `<th>${month}</th>`;
  });

  html += `</tr>`;

  Object.keys(categories).forEach(category => {

    html += `
      <tr>
        <td><strong>${category}</strong></td>
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

  });

  html += `</table>`;

  document.getElementById("budget")
    .innerHTML = html;

}


loadAccounts();
loadBudget();
