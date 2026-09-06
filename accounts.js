// ==================== FILE: accounts.js ====================
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("addAccountForm");

    if (!form) return;

    form.addEventListener("submit", handleAddAccount);

});

async function handleAddAccount(event) {

    event.preventDefault();

    const name =
        document.getElementById("accountName").value.trim();

    const netWorthType =
        document.getElementById("netWorthType").value;

    const assetClass =
        document.getElementById("accountType").value;

    const currentBalance =
        document.getElementById("openingBalance").value;

    const response = await fetch(
        `${BASE_URL}?action=addAccount`
        + `&name=${encodeURIComponent(name)}`
        + `&netWorthType=${encodeURIComponent(netWorthType)}`
        + `&assetClass=${encodeURIComponent(assetClass)}`
        + `&currentBalance=${encodeURIComponent(currentBalance)}`
    );

    const result = await response.json();

    if (!result.success) {
        alert("Failed to save account");
        return;
    }

    await loadData();
    loadAccounts();

    event.target.reset();

    alert("Account added");
}


function loadAccounts() {

    const container =
        document.getElementById("accounts");

    if (!container) return;

    container.innerHTML =
        appData.accounts.map(account => `
            <div class="account-card">
                <strong>${account.accountName}</strong>
                <div>${account.netWorthType}</div>
                <div>${formatCurrency(account.currentBalance)}</div>

                <button onclick="editAccount('${account.accountId}')">
                    Edit
                </button>

                <button onclick="deleteAccount('${account.accountId}')">
                    Delete
                </button>
            </div>
        `).join("");
}

async function deleteAccount(accountId) {

    const response = await fetch(
        `${BASE_URL}?action=deleteAccount`
        + `&accountId=${accountId}`
    );

    const result = await response.json();

    if (!result.success) {
        alert("Delete failed");
        return;
    }

    await loadData();

    loadAccounts();
}

async function editAccount(accountId) {

    const account =
        appData.accounts.find(
            a => a.accountId === accountId
        );

    if (!account) return;

    const newBalance =
        prompt(
            "New Balance",
            account.currentBalance
        );

    if (newBalance === null) return;

    const response = await fetch(
        `${BASE_URL}?action=updateAccount`
        + `&accountId=${accountId}`
        + `&currentBalance=${newBalance}`
    );

    const result = await response.json();

    if (!result.success) {
        alert("Update failed");
        return;
    }

    await loadData();

    loadAccounts();
}
