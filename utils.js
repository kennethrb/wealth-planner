console.log("UTILS FILE LOADED");


// Universal Philippine Peso Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

function showStatus(message, type = "success") {
    const status = document.getElementById("globalStatus");
    if (!status) return;
    status.className = `status-banner ${type}`;
    status.innerHTML = message;
    status.style.display = "block";
    clearTimeout(status.timeoutId);
    status.timeoutId = setTimeout(() => {
        status.classList.add("hide");
        setTimeout(() => {
            status.style.display = "none";
            status.classList.remove("hide");
        }, 300);
    }, 4000);
}

function showConfirmDialog(title, message) {
    return new Promise(resolve => {
        const modal = document.getElementById("confirmModal");
        const titleElement = document.getElementById("confirmTitle");
        const messageElement = document.getElementById("confirmMessage");
        const okButton = document.getElementById("confirmOk");
        const cancelButton = document.getElementById("confirmCancel");
        if (!modal) {
            resolve(confirm(`${title}\n\n${message}`));
            return;
        }
        titleElement.textContent = title;
        messageElement.textContent = message;
        modal.classList.add("show");
        okButton.onclick = () => {
            modal.classList.remove("show");
            resolve(true);
        };
        cancelButton.onclick = () => {
            modal.classList.remove("show");
            resolve(false);
        };
    });
}

// Show reusable input dialog
function showInputDialog(title, message, value = "") {
  return new Promise(resolve => {
    const modal = document.getElementById("inputModal");
    const titleEl = document.getElementById("inputTitle");
    const messageEl = document.getElementById("inputMessage");
    const inputEl = document.getElementById("inputValue");
    const saveBtn = document.getElementById("inputSave");
    const cancelBtn = document.getElementById("inputCancel");

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = value;

    modal.classList.add("show");

    saveBtn.onclick = () => {
      modal.classList.remove("show");
      resolve(inputEl.value);
    };

    cancelBtn.onclick = () => {
      modal.classList.remove("show");
      resolve(null);
    };

    inputEl.focus();
    inputEl.select();
  });
}


function parseTransactionDate(rawDate) {

    const date = new Date(rawDate);

    if (isNaN(date.getTime())) {
        return null;
    }

    return {
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        day: date.getDate()
    };
}
