// ==================== FILE: accounts.js ====================
/**
 * Handles the submit event for the Add Account HTML form.
 * @param {Event} event - The DOM submit event.
 */
function handleAddAccountForm(event) {
    event.preventDefault();

    // 1. Extract values from HTML form inputs
    const name = document.getElementById("accountName")?.value.trim();
    const netWorthType = document.getElementById("netWorthType")?.value;
    const assetClass = document.getElementById("accountType")?.value;
    const currentBalance = document.getElementById("openingBalance")?.value;

    if (!name) return;

    // 2. Pass values as a structured object to addAccount
    addAccount({
        name,
        netWorthType,
        assetClass,
        currentBalance
    });

    // 3. Reset form inputs
    const form = document.getElementById("addAccountForm");
    if (form) form.reset();
}

/**
 * Renders the list of accounts on the dashboard/accounts view.
 */
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
              <div class="item-actions">
                <span class="item-value">${formatCurrency(balance)}</span>
                <button type="button" class="btn-delete" onclick="deleteAccount(${account.id})" title="Delete Account">🗑️</button>
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
 * Calculates total balance by asset class across all accounts.
 */
function getAssetClassTotals() {
    const totals = {};
    if (!appData.accounts) return totals;
    appData.accounts.forEach(account => {
        if (account.netWorthType !== "Asset") {
            return;
        }
        const assetClass = account.assetClass || "Unclassified";
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

/**
 * Adds a new account to appData and refreshes the list view.
 * @param {Object} newAccount - The account details
 */
function addAccount(newAccount) {
    if (!appData.accounts) {
        appData.accounts = [];
    }

    const accountToAdd = {
        id: Date.now(),
        name: newAccount.name || 'New Account',
        netWorthType: newAccount.netWorthType || 'Asset',
        currentBalance: Number(newAccount.currentBalance) || 0,
        assetClass: newAccount.assetClass || 'Cash'
    };

    appData.accounts.push(accountToAdd);

    if (typeof loadAccounts === 'function') {
        loadAccounts();
    }
}

/**
 * Removes an account by ID from appData and refreshes the accounts UI.
 * @param {number|string} accountId - The unique identifier of the account to remove.
 */
function deleteAccount(accountId) {
    if (!appData.accounts) return;

    appData.accounts = appData.accounts.filter(
        account => account.id !== accountId
    );

    if (typeof loadAccounts === 'function') {
        loadAccounts();
    }
}
