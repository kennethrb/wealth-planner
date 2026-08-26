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
          Balance: ₱${account.currentBalance}
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

  const container =
    document.getElementById("budget");

  let html = "";

  data.forEach(item => {

    html += `
      <div class="budget-item">

        <strong>${item.category}</strong>

        <br>

        ${item.month}
        -
        ₱${item.plannedAmount}

      </div>
    `;

  });

  container.innerHTML = html;

}


loadAccounts();
loadBudget();
