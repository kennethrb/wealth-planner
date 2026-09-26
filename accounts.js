// ==================== FILE: accounts.js ====================

// Tracks whether the form is in "Add" mode (null) or "Edit" mode (accountId)
let editingAccountId = null;

/**
 * Populate account type dropdown based on selected net worth type
 */
function loadAccountTypes() {
    const netWorthTypeSelect = document.getElementById("netWorthType");
    const dropdown = document.getElementById("accountType");
    if (!netWorthTypeSelect || !dropdown || typeof ACCOUNT_TYPES === "undefined") return;

    const netWorthType = netWorthTypeSelect.value;
    const previousVal = dropdown.value;
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

    if (previousVal) dropdown.value = previousVal;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addAccountForm");
    if (form) {
        form.addEventListener("submit", handleAccountFormSubmit);
    }

    const netWorthTypeSelect = document.getElementById("netWorthType");
    if (netWorthTypeSelect) {
        netWorthTypeSelect.addEventListener("change", loadAccountTypes);
        loadAccountTypes();
    }
});

/**
 * READ: Renders active accounts list
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
                    <div class="goal-item" id="account-card-${id}">
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
 * Switch form to EDIT state and populate fields
 */
function editAccount(accountId) {
    const accounts = (typeof appData !== "undefined" && appData.accounts) ? appData.accounts : [];
    const account = accounts.find(a => (a.accountId || a.id) === accountId);
    if (!account) {
        showStatus("Account not found", "error");
        return;
    }

    editingAccountId = accountId;

    // 1. Populate Form Inputs
    const elName = document.getElementById("accountName");
    const elNetWorthType = document.getElementById("netWorthType");
    const elAccountType = document.getElementById("accountType");
    const elBalance = document.getElementById("openingBalance");
    const elProtected = document.getElementById("accountProtected");
    const elMinBalance = document.getElementById("minimumBalance");

    if (elName) elName.value = account.accountName || account.name || "";
    if (elNetWorthType) {
        elNetWorthType.value = account.netWorthType || "Asset";
        loadAccountTypes();
    }
    if (elAccountType) elAccountType.value = account.assetClass || account.type || "Cash";
    if (elBalance) elBalance.value = account.currentBalance !== undefined ? account.currentBalance : (account.openingBalance || 0);
    if (elProtected) elProtected.value = account.protected === true ? "true" : "false";
    if (elMinBalance) elMinBalance.value = account.minimumBalance || 0;

    // 2. Update Form Action Controls
    const formTitle = document.getElementById("accountFormTitle");
    const submitBtn = document.getElementById("accountFormSubmitBtn");
    const cancelBtn = document.getElementById("accountFormCancelBtn");

    if (formTitle) formTitle.textContent = "✏️ Edit Account";
    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (cancelBtn) cancelBtn.classList.remove("hidden");

    // 3. Scroll seamlessly to the form
    const form = document.getElementById("addAccountForm");
    if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

/**
 * Cancel Edit mode and restore ADD state
 */
function cancelAccountEdit() {
    editingAccountId = null;

    const form = document.getElementById("addAccountForm");
    if (form) form.reset();

    const formTitle = document.getElementById("accountFormTitle");
    const submitBtn = document.getElementById("accountFormSubmitBtn");
    const cancelBtn = document.getElementById("accountFormCancelBtn");

    if (formTitle) formTitle.textContent = "➕ Add Account";
    if (submitBtn) submitBtn.textContent = "➕ Add Account";
    if (cancelBtn) cancelBtn.classList.add("hidden");

    loadAccountTypes();
}

/**
 * Unified Form Handler (Dispatches to CREATE or UPDATE based on state)
 */
async function handleAccountFormSubmit(event) {
    if (event) event.preventDefault();

    const name = document.getElementById("accountName")?.value.trim() || "";
    const netWorthType = document.getElementById("netWorthType")?.value || "Asset";
    const assetClass = document.getElementById("accountType")?.value || "Cash";
    const balance = parseFloat(document.getElementById("openingBalance")?.value) || 0;
    const protectedSelect = document.getElementById("accountProtected");
    const isProtected = protectedSelect ? protectedSelect.value === "true" : false;
    const minimumBalance = parseFloat(document.getElementById("minimumBalance")?.value) || 0;

    if (!name) {
        showStatus("Please enter an account name", "warning");
        return;
    }

    const baseUrl = typeof GOOGLE_SCRIPT_URL !== "undefined" ? GOOGLE_SCRIPT_URL : (typeof BASE_URL !== "undefined" ? BASE_URL : "");
    const mode = getCurrentMode();

    if (editingAccountId) {
        // --- UPDATE ROUTE ---
        showStatus("Updating account...", "info");
        try {
            const params = new URLSearchParams({
                action: "updateAccount",
                mode: mode,
                accountId: editingAccountId,
                name: name,
                netWorthType: netWorthType,
                assetClass: assetClass,
                type: assetClass,
                currentBalance: balance,
                openingBalance: balance,
                protected: isProtected,
                minimumBalance: minimumBalance
            });

            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                showStatus("✅ Account updated successfully", "success");
                cancelAccountEdit();
                if (typeof loadData === "function") await loadData();
                if (typeof refreshUI === "function") await refreshUI();
            } else {
                showStatus("Update failed: " + (result.error || result.message), "error");
            }
        } catch (error) {
            console.error("updateAccount error:", error);
            showStatus("Failed to update account", "error");
        }
    } else {
        // --- CREATE ROUTE ---
        showStatus("Saving new account...", "info");
        try {
            const params = new URLSearchParams({
                action: "addAccount",
                mode: mode,
                name: name,
                netWorthType: netWorthType,
                assetClass: assetClass,
                type: assetClass,
                openingBalance: balance,
                currentBalance: balance,
                protected: isProtected,
                minimumBalance: minimumBalance
            });

            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                showStatus("Account added successfully", "success");
                cancelAccountEdit();
                if (typeof loadData === "function") await loadData();
                if (typeof refreshUI === "function") await refreshUI();
            } else {
                showStatus("Backend Error: " + (result.error || result.message), "error");
            }
        } catch (error) {
            console.error("addAccount error:", error);
            showStatus("Failed to add account: " + error.message, "error");
        }
    }
}

/**
 * DELETE: Soft delete with cascade safety check
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
            if (editingAccountId === accountId) cancelAccountEdit();
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

