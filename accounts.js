// ==================== FILE: accounts.js ====================

/**
 * Populate account type dropdown based on selected net worth type
 */
function loadAccountTypes() {
    const netWorthTypeSelect = document.getElementById("netWorthType");
    const dropdown = document.getElementById("accountType");
    if (!netWorthTypeSelect || !dropdown || typeof ACCOUNT_TYPES === "undefined") return;

    const netWorthType = netWorthTypeSelect.value;
    dropdown.innerHTML = "";

    Object.values(ACCOUNT_TYPES)
        .filter(type => type.netWorthType === netWorthType)
        .forEach(type => {
            dropdown.innerHTML += `
                <option value="${type.name}">
                    ${type.name}
                </option>
            `;
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addAccountForm");
    if (form) {
        form.addEventListener("submit", handleAddAccount);
    }

    const netWorthTypeSelect = document.getElementById("netWorthType");
    if (netWorthTypeSelect) {
        netWorthTypeSelect.addEventListener("change", loadAccountTypes);
        loadAccountTypes();
    }
});

/**
 * READ: Renders accounts using the exact original DOM hierarchy & CSS classes
 */
function loadAccounts() {
    const container = document.getElementById("accounts");
    if (!container) return;

    const accounts = (typeof appData !== "undefined" && appData.accounts) ? appData.accounts : [];
    const activeAccounts = accounts.filter(acc => acc.active !== false);

    if (activeAccounts.length === 0) {
        container.innerHTML = `
            <div class="goal-item">
                <span class="label">No accounts found</span>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="goals-container">
            ${activeAccounts.map(account => {
                const id = account.accountId || account.id;
                const name = account.accountName || account.name || "Unnamed Account";
                const balance = Number(
                    account.currentBalance !== undefined ? account.currentBalance : (account.openingBalance || account.balance || 0)
                );
                const type = account.netWorthType || "Asset";

                return `
                    <div class="goal-item">
                        <div class="item-header">
                            <span class="item-title">
                                💳 ${escapeHtml(name)}
                            </span>
                            <span class="item-value">
                                ${typeof formatCurrency === "function" ? formatCurrency(balance) : balance}
                            </span>
                        </div>

                        <div class="goal-details">
                            <span>
                                Type:
                                <strong class="${type === "Asset" ? "text-success" : "text-danger"}">
                                    ${type}
                                </strong>
                            </span>

                            <div style="display:flex; gap:8px; align-items:center;">
                                <button
                                    class="btn-secondary"
                                    onclick="editAccount('${id}')"
                                    title="Edit Account"
                                >
                                    ✏️
                                </button>
                                <button
                                    class="btn-danger"
                                    onclick="deleteAccount('${id}')"
                                    title="Delete Account"
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

/**
 * CREATE: Handle form submission for adding an account
 */
async function handleAddAccount(event) {
    if (event) event.preventDefault();

    const name = document.getElementById("accountName")?.value.trim() || "";
    const netWorthType = document.getElementById("netWorthType")?.value || "Asset";
    const assetClass = document.getElementById("accountType")?.value || "Cash";
    const openingBalance = parseFloat(document.getElementById("openingBalance")?.value) || 0;
    const isProtected = document.getElementById("accountProtected")?.checked || false;
    const minimumBalance = parseFloat(document.getElementById("minimumBalance")?.value) || 0;

    if (!name) {
        showStatus("Please enter an account name", "warning");
        return;
    }

    showStatus("Saving account to Google Sheets...", "info");

    try {
        const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
        const mode = getCurrentMode();

        const params = new URLSearchParams({
            action: "addAccount",
            mode: mode,
            name: name,
            netWorthType: netWorthType,
            assetClass: assetClass,
            openingBalance: openingBalance,
            currentBalance: openingBalance,
            protected: isProtected,
            minimumBalance: minimumBalance
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            showStatus("Account added successfully", "success");
            const form = document.getElementById("addAccountForm");
            if (form) form.reset();
            if (typeof loadData === "function") await loadData();
            if (typeof refreshUI === "function") await refreshUI();
        } else {
            showStatus("Backend Error: " + (result.error || result.message), "error");
        }
    } catch (error) {
        console.error("handleAddAccount error:", error);
        showStatus("Failed to add account: " + error.message, "error");
    }
}

/**
 * Opens the custom Edit Account modal and populates fields
 */
function editAccount(accountId) {
    const accounts = (typeof appData !== "undefined" && appData.accounts) ? appData.accounts : [];
    const account = accounts.find(a => (a.accountId || a.id) === accountId);
    if (!account) {
        showStatus("Account not found", "error");
        return;
    }

    const currentName = account.accountName || account.name || "";
    const currentBal = account.currentBalance !== undefined ? account.currentBalance : (account.openingBalance || account.balance || 0);

    // Populate modal form fields
    document.getElementById("editAccountId").value = accountId;
    document.getElementById("editAccountName").value = currentName;
    document.getElementById("editAccountBalance").value = currentBal;
    document.getElementById("editNetWorthType").value = account.netWorthType || "Asset";

    // Show custom modal
    const modal = document.getElementById("editAccountModal");
    if (modal) {
        modal.classList.remove("hidden");
    }
}

/**
 * Closes the Edit Account modal
 */
function closeEditAccountModal() {
    const modal = document.getElementById("editAccountModal");
    if (modal) {
        modal.classList.add("hidden");
    }
}

/**
 * Handles submission of the custom Edit Account form
 */
async function handleUpdateAccountForm(event) {
    if (event) event.preventDefault();

    const accountId = document.getElementById("editAccountId").value;
    const newName = document.getElementById("editAccountName").value.trim();
    const newBalance = parseFloat(document.getElementById("editAccountBalance").value);
    const netWorthType = document.getElementById("editNetWorthType").value;

    if (!newName || isNaN(newBalance)) {
        showStatus("Please enter valid account details", "warning");
        return;
    }

    closeEditAccountModal();
    showStatus("Updating account in Google Sheets...", "info");

    try {
        const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
        const mode = getCurrentMode();

        const params = new URLSearchParams({
            action: "updateAccount",
            mode: mode,
            accountId: accountId,
            name: newName,
            currentBalance: newBalance,
            netWorthType: netWorthType
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            showStatus("✅ Account updated successfully", "success");
            if (typeof loadData === "function") await loadData();
            if (typeof refreshUI === "function") await refreshUI();
        } else {
            showStatus("Update failed: " + (result.error || result.message), "error");
        }
    } catch (error) {
        console.error("handleUpdateAccountForm error:", error);
        showStatus("Failed to update account", "error");
    }
}

/**
 * DELETE: Soft delete using custom showConfirmDialog
 */
async function deleteAccount(accountId, forceDelete = false) {
    if (!forceDelete) {
        const confirmed = typeof showConfirmDialog === "function" 
            ? await showConfirmDialog("Delete Account", "Are you sure you want to delete this account?")
            : confirm("Are you sure you want to delete this account?");
        if (!confirmed) return;
    }

    showStatus("Deleting account...", "info");

    try {
        const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
        const mode = getCurrentMode();

        const params = new URLSearchParams({
            action: "deleteAccount",
            mode: mode,
            accountId: accountId,
            forceDelete: forceDelete ? "true" : "false"
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const result = await response.json();

        if (!result.success && result.requiresConfirmation) {
            const proceed = typeof showConfirmDialog === "function"
                ? await showConfirmDialog("Cascade Dependency Warning", `${result.message}\n\nDo you still want to force delete this account?`)
                : confirm(`⚠️ CASCADE WARNING:\n\n${result.message}\n\nDo you still want to force delete this account?`);
            
            if (proceed) {
                await deleteAccount(accountId, true);
            } else {
                showStatus("Deletion canceled", "info");
            }
            return;
        }

        if (result.success) {
            showStatus("🗑 Account deleted successfully", "success");
            if (typeof loadData === "function") await loadData();
            if (typeof refreshUI === "function") await refreshUI();
        } else {
            showStatus("Delete failed: " + (result.error || result.message), "error");
        }
    } catch (error) {
        console.error("deleteAccount error:", error);
        showStatus("Failed to delete account", "error");
    }
}

/**
 * Helper: Resolve current mode
 */
function getCurrentMode() {
    if (typeof CURRENT_MODE !== "undefined") return CURRENT_MODE;
    if (typeof appMode !== "undefined") return appMode;
    if (typeof appData !== "undefined" && appData.mode) return appData.mode;
    return "TEST";
}

/**
 * Helper: HTML Sanitizer
 */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
