const API_URL =
  "https://script.google.com/macros/s/AKfycbwZGBobKrROvavAglc9QZlBmbSggBudqJBH6dT7LrkPopdZDQVbCZ4FWhE926f1Z_Y-NQ/exec?action=getAccounts";

async function loadAccounts() {

  const response = await fetch(API_URL);

  const accounts = await response.json();

  const container =
    document.getElementById("accounts");

  let html = "";

  accounts.forEach(account => {

    html += `
      <div>
        <h3>${account.accountName}</h3>
        <p>Balance: ₱${account.currentBalance}</p>
      </div>
      <hr>
    `;

  });

  container.innerHTML = html;

}

loadAccounts();
