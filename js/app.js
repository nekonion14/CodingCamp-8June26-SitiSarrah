let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let alertLimit = localStorage.getItem('alertLimit') || 0;
let currentTheme = localStorage.getItem('theme') || 'light';
let spendingChart = null;

const transactionForm = document.getElementById('transaction-form');
const itemNameInput = document.getElementById('item-name');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const transactionList = document.getElementById('transaction-list');
const totalBalanceEl = document.getElementById('total-balance');
const sortOptions = document.getElementById('sort-options');
const budgetLimitInput = document.getElementById('budget-limit');
const limitAlertEl = document.getElementById('limit-alert');
const themeToggleBtn = document.getElementById('theme-toggle');

document.addEventListener('DOMContentLoaded', () => {
    budgetLimitInput.value = alertLimit > 0 ? alertLimit : '';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    initChart();
    updateUI();
});

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!itemNameInput.value.trim() || !amountInput.value || !categoryInput.value) {
        alert('Please fill in all fields.');
        return;
    }

    const transaction = {
        id: Date.now(),
        name: itemNameInput.value.trim(),
        amount: parseFloat(amountInput.value),
        category: categoryInput.value
    };

    transactions.push(transaction);
    saveData();
    updateUI();
    transactionForm.reset();
});

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateUI();
}

function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateUI() {
    const total = transactions.reduce((sum, item) => sum + item.amount, 0);
    totalBalanceEl.textContent = `$${total.toFixed(2)}`;

    if (alertLimit > 0 && total > alertLimit) {
        limitAlertEl.classList.remove('hidden');
    } else {
        limitAlertEl.classList.add('hidden');
    }

    renderList();
    updateChartValues();
}

function renderList() {
    transactionList.innerHTML = '';

    if (transactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">No transactions yet.</p>';
        return;
    }

    let sortedTransactions = [...transactions];
    const sortBy = sortOptions.value;

    if (sortBy === 'amount-high') {
        sortedTransactions.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'amount-low') {
        sortedTransactions.sort((a, b) => a.amount - b.amount);
    } else if (sortBy === 'category') {
        sortedTransactions.sort((a, b) => a.category.localeCompare(b.category));
    } else {
        sortedTransactions.sort((a, b) => b.id - a.id);
    }

    sortedTransactions.forEach(item => {
        const row = document.createElement('div');
        row.className = 'transaction-item';
        row.innerHTML = `
            <div class="item-info">
                <div class="item-title">${escapeHTML(item.name)}</div>
                <div class="item-meta">${item.category}</div>
            </div>
            <div class="item-amount-action">
                <span class="item-price">$${item.amount.toFixed(2)}</span>
                <button class="btn-delete" onclick="deleteTransaction(${item.id})">Delete</button>
            </div>
        `;
        transactionList.appendChild(row);
    });
}

function initChart() {
    const ctx = document.getElementById('spending-chart').getContext('2d');
    spendingChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Food', 'Transport', 'Fun'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#2ecc71', '#3498db', '#e67e22'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: currentTheme === 'dark' ? '#f5f5f5' : '#333333' }
                }
            }
        }
    });
}

function updateChartValues() {
    const categoryTotals = { Food: 0, Transport: 0, Fun: 0 };
    transactions.forEach(item => {
        if (categoryTotals[item.category] !== undefined) {
            categoryTotals[item.category] += item.amount;
        }
    });

    if (spendingChart) {
        spendingChart.data.datasets[0].data = [
            categoryTotals.Food,
            categoryTotals.Transport,
            categoryTotals.Fun
        ];
        spendingChart.options.plugins.legend.labels.color = currentTheme === 'dark' ? '#f5f5f5' : '#333333';
        spendingChart.update();
    }
}

sortOptions.addEventListener('change', renderList);

budgetLimitInput.addEventListener('input', (e) => {
    alertLimit = parseFloat(e.target.value) || 0;
    localStorage.setItem('alertLimit', alertLimit);
    updateUI();
});

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateChartValues();
});

// Fitur Keamanan Pengaman Input
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}