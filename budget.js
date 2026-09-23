function loadCategoryDropdown() {

    const deleteSelect =
        document.getElementById(
            "deleteCategorySelect"
        );

    if (deleteSelect)
        deleteSelect.innerHTML = "";

    appData.categories.forEach(cat => {

        if (deleteSelect) {
            deleteSelect.innerHTML += `
                <option value="${cat.categoryId}">
                    ${cat.categoryName}
                </option>
            `;
        }

    });
}

let hasUnsavedBudgetChanges = false;
