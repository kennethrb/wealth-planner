// ==================== FILE: accounts.js ====================

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

/**
 * Calculates total balance by asset class across all accounts.
 */
function getAssetClassTotals() {
    const totals = {};
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
 * @param {Object} newAccount - The account details (e.g., name, netWorthType, currentBalance, assetClass)
 */
function addAccount(newAccount) {
    // 1. Ensure appData.accounts exists
    if (!appData.accounts) {
        appData.accounts = [];
    }

    // 2. Add default properties if needed and push to array
    const accountToAdd = {
        id: Date.now(), // Unique ID for key tracking
        name: newAccount.name || 'New Account',
        netWorthType: newAccount.netWorthType || 'Asset', // 'Asset' or 'Liability'
        currentBalance: Number(newAccount.currentBalance) || 0,
        assetClass: newAccount.assetClass || 'Cash'
    };

    appData.accounts.push(accountToAdd);

    // 3. Refresh the accounts UI
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

    // Filter out the account with the matching ID
    appData.accounts = appData.accounts.filter(
        account => account.id !== accountId
    );

    // Refresh the accounts UI
    if (typeof loadAccounts === 'function') {
        loadAccounts();
    }
}
