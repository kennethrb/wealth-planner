// ==================== FILE: accounts.js ====================

/**
 * READ: Renders the list of accounts on the UI.
 */
function loadAccounts() {
    const container = document.getElementById("accounts");
    if (!container) return;
    
    if (!appData.accounts || appData.accounts.length === 0) {
        container.innerHTML = `<div class="goal-item"><span class="label">No active accounts found</span></div>`;
        return;
    }

    container.innerHTML = `
    <div class="goals-container">
      ${appData.accounts.map(account => {
        const id = account.accountId || account.id;
        const name = account.name || account.accountName || 'Unnamed Account';
        const balance = Number(account.currentBalance || account.balance || 0);
        const type = account.netWorthType || 'Asset';
        const assetClass = account.assetClass || account.type || 'Cash';

        return `
          <div class="goal-item">
            <div class="item-header">
              <span class="item-title">💳 ${name} (${assetClass})</span>
              <div class="item-actions">
                <span class="item-value">${formatCurrency(balance)}</span>
                <button type="button" class="btn-secondary" onclick="editAccount('${id}')" title="Edit Account">✏️</button>
                <button type="button" class="btn-delete" onclick="deleteAccount('${id}')" title="Delete Account">🗑️</button>
              </div>
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

/**
 * CREATE: Handles submitting the HTML form to create a new account.
 */
function handleAddAccountForm(event) {
    event.preventDefault();

    const name = document.getElementById("accountName")?.value.trim();
    const netWorthType = document.getElementById("netWorthType")?.value;
    const assetClass = document.getElementById("accountType")?.value;
    const currentBalance = document.getElementById("openingBalance")?.value;

    if (!name) return;

    addAccount({
        name,
        netWorthType,
        assetClass,
        currentBalance
    });

    const form = document.getElementById("addAccountForm");
    if (form) form.reset();
}

/**
 * CREATE: Sends API request to backend Google Sheet to save the account.
 */
function addAccount(newAccount) {
    showStatus("Saving account to Google Sheets...", "info");

    const params = new URLSearchParams({
        action: "addAccount",
        name: newAccount.name,
        netWorthType: newAccount.netWorthType,
        assetClass: newAccount.assetClass,
        type: newAccount.assetClass,
        currentBalance: newAccount.currentBalance
    });

    fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`)
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showStatus("Account saved successfully!", "success");
                refreshAllData(); // Reloads appData from Sheets
            } else {
                showStatus("Error saving account: " + res.error, "error");
            }
        })
        .catch(err => {
            console.error(err);
            showStatus("Failed to connect to backend", "error");
        });
}

/**
 * UPDATE: Prompt user for edits and push updates to backend Google Sheet.
 */
function editAccount(accountId) {
    const account = appData.accounts.find(a => (a.accountId || a.id) === accountId);
    if (!account) return;

    const newName = prompt("Edit Account Name:", account.accountName || account.name);
    if (newName === null) return; // Canceled

    const newBalanceStr = prompt("Edit Current Balance:", account.currentBalance || account.balance || 0);
    if (newBalanceStr === null) return; // Canceled

    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) {
        alert("Invalid balance entered");
        return;
    }

    showStatus("Updating account...", "info");

    const params = new URLSearchParams({
        action: "updateAccount",
        accountId: accountId,
        name: newName,
        currentBalance: newBalance
    });

    fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`)
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showStatus("Account updated successfully!", "success");
                refreshAllData();
            } else {
                showStatus("Error updating account: " + res.error, "error");
            }
        })
        .catch(err => {
            console.error(err);
            showStatus("Failed to update account", "error");
        });
}

/**
 * DELETE: Soft deletes the account from backend Google Sheet.
 */
function deleteAccount(accountId) {
    if (!confirm("Are you sure you want to delete this account?")) return;

    showStatus("Deleting account...", "info");

    const params = new URLSearchParams({
        action: "deleteAccount",
        accountId: accountId
    });

    fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`)
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showStatus("Account deleted successfully!", "success");
                refreshAllData();
            } else {
                showStatus("Error deleting account: " + res.error, "error");
            }
        })
        .catch(err => {
            console.error(err);
            showStatus("Failed to delete account", "error");
        });
}

/**
 * Calculates total balance by asset class across all active accounts.
 */
function getAssetClassTotals() {
    const totals = {};
    if (!appData.accounts) return totals;
    appData.accounts.forEach(account => {
        if (account.netWorthType !== "Asset") return;
        const assetClass = account.assetClass || account.type || "Unclassified";
        const balance = Number(account.currentBalance || account.balance || 0);
        totals[assetClass] = (totals[assetClass] || 0) + balance;
    });
    return totals;
}

/**
 * Calculates percentage asset allocation.
 */
function getAssetAllocation() {
    const totals = getAssetClassTotals();
    const totalAssets = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const allocation = {};
    Object.entries(totals).forEach(([assetClass, value]) => {
        allocation[assetClass] = {
            amount: value,
            percent: totalAssets > 0 ? Number(((value / totalAssets) * 100).toFixed(1)) : 0
        };
    });
    return allocation;
}
