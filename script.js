(function() {
    'use strict';

    // --- Firebaseの初期化 ---
    const firebaseConfig = {
        apiKey: "AIzaSyAHedAobhiYqsb1OKZBPesMK2CCxFVOBRw",
        authDomain: "thequeen-sbudget.firebaseapp.com",
        databaseURL: "https://thequeen-sbudget-default-rtdb.firebaseio.com",
        projectId: "thequeen-sbudget",
        storageBucket: "thequeen-sbudget.appspot.com",
        messagingSenderId: "588036901053",
        appId: "1:588036901053:web:133698ab8684aa8b7c8fd4"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // --- 定数定義 ---
    const MONTHLY_VARIABLE_BUDGET = 350000;
    const MONTHLY_FIXED_BUDGETS = {
        '住宅ローン①': 77041, '住宅ローン②': 132925, '保険': 38652, '管理費': 43290, 'AIC': 13860, '車ローン': 81130, '早稲田アカデミー': 75400, '学校': 170000, 'ガス': 12000, 'タップ': 8580, '水': 3974, 'ワイン': 5500, 'BEYOND': 35200, 'docomo': 19000, '電気': 20000, 'ダスキン': 40000, 'ベネッセ': 5320, 'チャットGPT': 3000, 'NTT': 330, 'Google': 3380, '車保険': 30690, 'みなのクリニック': 4480, '定期': 28250, '水道／2ヶ月': 20000
    };
    const CATEGORIES = {
        variable: ['食費', '日用品', '交通費', '交際費', '娯楽', '医療費', 'その他'],
        fixed: Object.keys(MONTHLY_FIXED_BUDGETS)
    };
    const CATEGORY_ICONS = {
        '食費': '♙', '日用品': '♟', '交通費': '♘', '交際費': '♗', '娯楽': '♕', '医療費': '♖', 'その他': '…', '住宅ローン①': '♔', '住宅ローン②': '♔', '保険': '♖', '管理費': '♖', 'AIC': '♗', '車ローン': '♘', '早稲田アカデミー': '♗', '学校': '♗', 'ガス': '♟', 'タップ': '♟', '水': '♟', 'ワイン': '♕', 'BEYOND': '♕', 'docomo': '♟', '電気': '♟', 'ダスキン': '♟', 'ベネッセ': '♗', 'チャットGPT': '♕', 'NTT': '♟', 'Google': '♕', '車保険': '♖', 'みなのクリニック': '♖', '定期': '♘', '水道／2ヶ月': '♟'
    };

    // --- グローバル変数 ---
    let weeklyChart = null;

    // --- UI描画ロジック ---
    // 全てのUIをデータに基づいて再描画する
    function renderAll(data) {
        const safeData = data || { variable: [], fixed: [] };
        safeData.variable = safeData.variable || [];
        safeData.fixed = safeData.fixed || [];

        renderSummaries(safeData);
        renderExpenseLists(safeData);
        renderWeeklySummary(safeData);
    }

    function renderSummaries(data) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const filterCurrentMonth = (expenses) => expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth;
        });

        const formatYen = (amount) => `¥${amount.toLocaleString()}`;

        // 変動費サマリー
        const currentMonthVariable = filterCurrentMonth(data.variable);
        const totalVariableSpent = currentMonthVariable.reduce((sum, exp) => sum + exp.amount, 0);
        const remainingBalance = MONTHLY_VARIABLE_BUDGET - totalVariableSpent;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const remainingDays = Math.max(0, daysInMonth - today.getDate() + 1);
        const remainingWeeks = remainingDays > 0 ? Math.ceil(remainingDays / 7) : 0;
        const dailyAllowance = remainingDays > 0 ? Math.floor(remainingBalance / remainingDays) : 0;
        const weeklyAllowance = remainingWeeks > 0 ? Math.floor(remainingBalance / remainingWeeks) : 0;
        
        document.getElementById('summary-variable-remaining').textContent = formatYen(remainingBalance);
        document.getElementById('summary-variable-daily').textContent = formatYen(dailyAllowance);
        document.getElementById('summary-variable-weekly').textContent = formatYen(weeklyAllowance);

        // 固定費サマリー
        const currentMonthFixed = filterCurrentMonth(data.fixed);
        const fixedSummaryGrid = document.getElementById('summary-fixed-grid');
        fixedSummaryGrid.innerHTML = '';

        const totalFixedBudget = Object.values(MONTHLY_FIXED_BUDGETS).reduce((sum, budget) => sum + budget, 0);
        document.getElementById('summary-fixed-total-budget').textContent = formatYen(totalFixedBudget);
        
        for (const category in MONTHLY_FIXED_BUDGETS) {
            const budget = MONTHLY_FIXED_BUDGETS[category];
            const spent = currentMonthFixed
                .filter(exp => exp.category === category)
                .reduce((sum, exp) => sum + exp.amount, 0);
            const remaining = budget - spent;

            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <h3>${getCategoryIcon(category)}</h3>
                <p>実績: <strong>${formatYen(spent)}</strong></p>
                <p class="budget">予算: ${formatYen(budget)}</p>
                <p>差額: <strong class="${remaining < 0 ? 'over-budget' : ''}">${formatYen(remaining)}</strong></p>
            `;
            fixedSummaryGrid.appendChild(item);
        }
    }

    function renderWeeklySummary(data) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const currentMonthVariableExpenses = data.variable.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth;
        });

        const getStartOfWeek = (d) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day;
            return new Date(date.setDate(diff));
        };

        const weeklyExpenses = currentMonthVariableExpenses.reduce((acc, expense) => {
            const weekStartDate = getStartOfWeek(expense.date);
            const weekStartString = weekStartDate.toISOString().split('T')[0];
            if (!acc[weekStartString]) acc[weekStartString] = 0;
            acc[weekStartString] += expense.amount;
            return acc;
        }, {});

        const summaryListEl = document.getElementById('weekly-summary-list');
        summaryListEl.innerHTML = '';
        const sortedWeeks = Object.keys(weeklyExpenses).sort();

        sortedWeeks.forEach(weekStartString => {
            const weekStart = new Date(weekStartString);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const amount = weeklyExpenses[weekStartString];
            const item = document.createElement('div');
            item.className = 'weekly-summary-item';
            item.innerHTML = `<span>${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}</span><strong>¥${amount.toLocaleString()}</strong>`;
            summaryListEl.appendChild(item);
        });

        const ctx = document.getElementById('weekly-spending-chart').getContext('2d');
        const labels = sortedWeeks.map(weekStartString => {
            const weekStart = new Date(weekStartString);
            return `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        });
        const chartData = sortedWeeks.map(week => weeklyExpenses[week]);

        if (weeklyChart) weeklyChart.destroy();

        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weekly Spending (JPY)',
                    data: chartData,
                    backgroundColor: 'rgba(212, 185, 150, 0.6)',
                    borderColor: 'rgba(212, 185, 150, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#e0e0e0' } } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => `¥${value.toLocaleString()}`, color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    function renderExpenseLists(data) {
        const renderList = (type, containerId) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            const expenses = data[type].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            expenses.forEach(expense => {
                const row = container.insertRow();
                let cell;
                cell = row.insertCell(0); cell.textContent = expense.date; cell.dataset.label = 'Date';
                cell = row.insertCell(1); cell.textContent = `¥${expense.amount.toLocaleString()}`; cell.dataset.label = 'Amount';
                cell = row.insertCell(2); cell.innerHTML = getCategoryIcon(expense.category) + expense.category; cell.dataset.label = 'Category';
                cell = row.insertCell(3); cell.textContent = expense.memo; cell.dataset.label = 'Memo';
                const actionCell = row.insertCell(4); actionCell.dataset.label = 'Actions'; actionCell.style.display = 'flex'; actionCell.style.gap = '5px';

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => populateFormForEdit(type, expense.id));
                actionCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.style.backgroundColor = '#c0392b';
                deleteButton.addEventListener('click', () => handleDeleteExpense(type, expense.id));
                actionCell.appendChild(deleteButton);
            });
        };
        renderList('variable', 'expense-list-variable');
        renderList('fixed', 'expense-list-fixed');
    }

    function getCategoryIcon(category) {
        return `<span class="category-icon">${CATEGORY_ICONS[category] || '•'}</span>`;
    }

    // --- フォームと状態管理 ---
    async function populateFormForEdit(type, id) {
        const snapshot = await db.ref('expenses').once('value');
        const data = snapshot.val() || { variable: [], fixed: [] };
        const expense = (data[type] || []).find(exp => exp.id === id);
        if (!expense) return;

        document.getElementById(`type-`).checked = true;
        updateCategoryOptions();
        document.getElementById('date').value = expense.date;
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.category;
        document.getElementById('memo').value = expense.memo;
        document.getElementById('edit-id').value = expense.id;

        document.getElementById('form-title-add').style.display = 'none';
        document.getElementById('form-title-edit').style.display = 'block';
        document.getElementById('form-submit-button').textContent = 'Update Expense';
        document.getElementById('cancel-edit-button').style.display = 'block';
        document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
    }

    function resetForm() {
        document.getElementById('expense-form').reset();
        document.getElementById('edit-id').value = '';
        updateCategoryOptions();
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('form-title-add').style.display = 'block';
        document.getElementById('form-title-edit').style.display = 'none';
        document.getElementById('form-submit-button').textContent = 'Add Expense';
        document.getElementById('cancel-edit-button').style.display = 'none';
    }

    // --- イベントハンドラ (Firebase操作) ---
    async function handleFormSubmit(event) {
        event.preventDefault();
        const editId = document.getElementById('edit-id').value;
        const type = document.querySelector('input[name="expense-type"]:checked').value;

        const expenseData = {
            id: editId || db.ref().push().key, // 新規作成時はFirebaseのユニークIDを生成
            date: document.getElementById('date').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            memo: document.getElementById('memo').value
        };

        if (!expenseData.date || isNaN(expenseData.amount) || expenseData.amount <= 0 || !expenseData.category) {
            alert('有効な日付、正の金額、カテゴリを入力してください。');
            return;
        }

        const snapshot = await db.ref('expenses').once('value');
        const data = snapshot.val() || { variable: [], fixed: [] };
        data.variable = data.variable || [];
        data.fixed = data.fixed || [];

        if (editId) {
            const expenseIndex = data[type].findIndex(exp => exp.id === editId);
            if (expenseIndex > -1) data[type][expenseIndex] = expenseData;
        } else {
            data[type].push(expenseData);
        }

        db.ref('expenses').set(data).then(resetForm);
    }

    async function handleDeleteExpense(type, idToDelete) {
        if (!confirm('この支出を削除してもよろしいですか？')) return;

        const snapshot = await db.ref('expenses').once('value');
        const data = snapshot.val();
        if (!data || !data[type]) return;
        
        data[type] = data[type].filter(expense => expense.id !== idToDelete);
        db.ref('expenses').set(data);
    }

    function updateCategoryOptions() {
        const type = document.querySelector('input[name="expense-type"]:checked').value;
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">選択してください</option>';
        CATEGORIES[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    function setupTabs() {
        const tabContainers = document.querySelectorAll('.container');
        tabContainers.forEach(container => {
            const tabs = container.querySelectorAll(':scope > section .tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetId = tab.dataset.tab;
                    const parentSection = tab.closest('section');
                    const relevantTabs = parentSection.querySelectorAll('.tab');
                    const relevantContents = parentSection.querySelectorAll('.tab-content');
                    relevantTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === targetId));
                    relevantContents.forEach(content => content.classList.toggle('active', content.id === targetId));
                });
            });
        });
    }
    
    // --- 初期化処理 ---
    function initialize() {
        // Firebaseのデータが変更されるたびに、UI全体を再描画する
        db.ref('expenses').on('value', (snapshot) => {
            const data = snapshot.val();
            renderAll(data);
        });

        document.getElementById('expense-form').addEventListener('submit', handleFormSubmit);
        document.getElementById('cancel-edit-button').addEventListener('click', resetForm);
        document.querySelectorAll('input[name="expense-type"]').forEach(radio => {
            radio.addEventListener('change', updateCategoryOptions);
        });
        
        document.getElementById('date').valueAsDate = new Date();
        updateCategoryOptions();
        setupTabs();
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
