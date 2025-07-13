// script.js の一番上から貼り付けます
(function() {
  'use strict';

  const firebaseConfig = {
  apiKey: "AIzaSyAHedAobhiYqsb1OKZBPesMK2CCxFVOBRw",
  authDomain: "thequeen-sbudget.firebaseapp.com",
  databaseURL: "https://thequeen-sbudget-default-rtdb.firebaseio.com",
  projectId: "thequeen-sbudget",
  storageBucket: "thequeen-sbudget.firebasestorage.app",
  messagingSenderId: "588036901053",
  appId: "1:588036901053:web:133698ab8684aa8b7c8fd4"
};
  // ↑↑↑ コピーした最新のコードはここまで ↑↑↑

  // --- Firebaseの初期化 ---
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database(); // Realtime Databaseへの参照

  // --- ここからあなたのアプリの定数定義やグローバル変数 ---
  const STORAGE_KEY = 'household_data'; // この行は、この下に続くようにします
  let CATEGORY_ICONS = {
    // ... このオブジェクトの中身はあなたのアプリに合わせて調整してください
  };
  let weeklyChart = null; // グローバル変数はそのまま
  // ... その他のコード ...
    // --- 定数定義 ---
    const STORAGE_KEY = 'household_data';
    const MONTHLY_VARIABLE_BUDGET = 350000; // 変動費の月間予算

    // 固定費の項目別予算 (ご自身の予算に合わせて金額を修正してください)
    const MONTHLY_FIXED_BUDGETS = {
        '住宅ローン①': 77041,
        '住宅ローン②': 132925,
        '保険': 38652,
        '管理費': 43290,
        'AIC': 13860,
        '車ローン': 81130,
        '早稲田アカデミー': 75400,
        '学校': 170000,
        'ガス': 12000,
        'タップ': 8580,
        '水': 3974,
        'ワイン': 5500,
        'BEYOND': 35200,
        'docomo': 19000,
        '電気': 20000,
        'ダスキン': 40000,
        'ベネッセ': 5320,
        'チャットGPT': 3000,
        'NTT': 330,
        'Google': 3380,
        '車保険': 30690,
        'みなのクリニック': 4480,
        '定期': 28250,
        '水道／2ヶ月': 20000
    };

    // カテゴリ定義
    const CATEGORIES = {
        variable: ['食費', '日用品', '交通費', '交際費', '娯楽', '医療費', 'その他'],
        fixed: Object.keys(MONTHLY_FIXED_BUDGETS)
    };

    // カテゴリとチェスの駒アイコンを関連付けるオブジェクト
    const CATEGORY_ICONS = {
        // 変動費
        '食費': '♙',          // ポーン: 基本的で頻繁な支出
        '日用品': '♟',        // ポーン(黒): 食費と並ぶ基本的な支出
        '交通費': '♘',        // ナイト: 移動を象徴
        '交際費': '♗',        // ビショップ: 人との関わり
        '娯楽': '♕',          // クイーン: 最も自由で強力な支出
        '医療費': '♖',        // ルーク: 城、守り
        'その他': '…',
        // 固定費
        '住宅ローン①': '♔',    // キング: 家計の王様、中心
        '住宅ローン②': '♔',
        '保険': '♖',
        '管理費': '♖',
        'AIC': '♗',
        '車ローン': '♘',
        '早稲田アカデミー': '♗',
        '学校': '♗',
        'ガス': '♟',
        'タップ': '♟',
        '水': '♟',
        'ワイン': '♕',
        'BEYOND': '♕',
        'docomo': '♟',
        '電気': '♟',
        'ダスキン': '♟',
        'ベネッセ': '♗',
        'チャットGPT': '♕',
        'NTT': '♟',
        'Google': '♕',
        '車保険': '♖',
        'みなのクリニック': '♖',
        '定期': '♘',
        '水道／2ヶ月': '♟'
    };

    // --- グローバル変数 ---
    let weeklyChart = null; // グラフのインスタンスを保持する変数

    // --- データ管理ロジック ---
    function loadData() {
       // **** ↓↓↓ loadData() 関数の中身を、この形に書き換えてください ↓↓↓ ****
async function loadData() { // async を追加します
    try {
        // Firebaseの'expenses'という場所からデータを読み込みます
        const snapshot = await database.ref('expenses').once('value'); // await を追加します
        const data = snapshot.val(); // Firebaseから取得した値

        // データが取得できたらそのデータを、なければ空っぽのデータを返します
        return data ? data : { variable: [], fixed: [] };
    } catch (error) {
        console.error("Firebaseからのデータ読み込みエラー:", error);
        // もしエラーが出ても、アプリが止まらないように空っぽのデータを返します
        return { variable: [], fixed: [] };
    }
}
// **** ↑↑↑ loadData() 関数はここまで書き換え ↑↑↑
        }
    }

    function saveData(data) {
        // **** ↓↓↓ saveData(data) 関数の中身を、この形に書き換えてください ↓↓↓ ****
function saveData(data) {
    // 'expenses'という場所にデータをセット（保存）します
    database.ref('expenses').set(data)
        .then(() => {
            console.log("データをFirebaseに保存しました！");
        })
        .catch((error) => {
            console.error("Firebaseへのデータ保存エラー:", error);
        });
}
// **** ↑↑↑ saveData(data) 関数はここまで書き換え ↑↑↑
    }

    function generateUniqueId() {
        // crypto.randomUUID() は安全なコンテキスト(HTTPSなど)でのみ利用可能です。
        // file:// で開いた場合などに備えて、代替手段を用意します。
        if (self.crypto && self.crypto.randomUUID) {
            return self.crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * カテゴリ名に対応するアイコンHTMLを返す
     * @param {string} category カテゴリ名
     * @returns {string} アイコンを含むspanタグ
     */
    function getCategoryIcon(category) {
        return `<span class="category-icon">${CATEGORY_ICONS[category] || '•'}</span>`;
    }

    // --- 計算 & UI描画ロジック ---

    function renderAll() { // 全ての表示を更新する
        renderSummaries();
        renderExpenseLists();
        renderWeeklySummary(); // 週次サマリーの描画を追加
    }

    function renderSummaries() {
        const data = loadData();
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
                <h3>${getCategoryIcon(category)}${category}</h3>
                <p>実績: <strong>${formatYen(spent)}</strong></p>
                <p class="budget">予算: ${formatYen(budget)}</p>
                <p>差額: <strong class="${remaining < 0 ? 'over-budget' : ''}">${formatYen(remaining)}</strong></p>
            `;
            fixedSummaryGrid.appendChild(item);
        }
    }

    // 週ごとのサマリーとグラフを描画する関数 (ここから追加)
    function renderWeeklySummary() {
        const data = loadData();
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 今月の変動費のみをフィルタリング
        const currentMonthVariableExpenses = data.variable.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth;
        });

        // 週の開始日（日曜日）を取得するヘルパー関数
        const getStartOfWeek = (d) => {
            const date = new Date(d);
            const day = date.getDay(); // 0 (Sunday) - 6 (Saturday)
            const diff = date.getDate() - day;
            return new Date(date.setDate(diff));
        };

        // 週ごとに支出を集計
        const weeklyExpenses = currentMonthVariableExpenses.reduce((acc, expense) => {
            const weekStartDate = getStartOfWeek(expense.date);
            const weekStartString = weekStartDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

            if (!acc[weekStartString]) {
                acc[weekStartString] = 0;
            }
            acc[weekStartString] += expense.amount;
            return acc;
        }, {});

        // 週のリスト表示
        const summaryListEl = document.getElementById('weekly-summary-list');
        summaryListEl.innerHTML = ''; // 表示をリセット
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

        // グラフ描画
        const ctx = document.getElementById('weekly-spending-chart').getContext('2d');
        const labels = sortedWeeks.map(weekStartString => {
            const weekStart = new Date(weekStartString);
            return `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        });
        const chartData = sortedWeeks.map(week => weeklyExpenses[week]);

        if (weeklyChart) {
            weeklyChart.destroy(); // 既存のグラフがあれば破棄
        }

        weeklyChart = new Chart(ctx, {
            type: 'bar', // 棒グラフ
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weekly Spending (JPY)',
                    data: chartData,
                    backgroundColor: 'rgba(212, 185, 150, 0.6)', // テーマのアクセントカラー
                    borderColor: 'rgba(212, 185, 150, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0' // 凡例のテキスト色
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '¥' + value.toLocaleString(); },
                            color: '#e0e0e0' // Y軸のテキスト色
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // Y軸のグリッド線色
                        }
                    },
                    x: {
                        ticks: {
                            color: '#e0e0e0' // X軸のテキスト色
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // X軸のグリッド線色
                        }
                    }
                }
            }
        });
    }
    // (ここまで追加)

    function renderExpenseLists() {
        const data = loadData();
        const renderList = (type, containerId) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            const expenses = data[type].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            expenses.forEach(expense => {
                // 各セルにdata-label属性を追加して、CSSでラベルを表示できるようにします
                const row = container.insertRow();
                let cell;

                cell = row.insertCell(0);
                cell.textContent = expense.date;
                cell.dataset.label = 'Date';

                cell = row.insertCell(1);
                cell.textContent = `¥${expense.amount.toLocaleString()}`;
                cell.dataset.label = 'Amount';

                cell = row.insertCell(2);
                cell.innerHTML = getCategoryIcon(expense.category) + expense.category;
                cell.dataset.label = 'Category';

                cell = row.insertCell(3);
                cell.textContent = expense.memo;
                cell.dataset.label = 'Memo';

                const actionCell = row.insertCell(4);
                actionCell.dataset.label = 'Actions';
                actionCell.style.display = 'flex';
                actionCell.style.gap = '5px';

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.style.width = 'auto';
                editButton.addEventListener('click', () => populateFormForEdit(type, expense.id));
                actionCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.style.width = 'auto';
                deleteButton.style.backgroundColor = '#c0392b';
                deleteButton.addEventListener('click', () => handleDeleteExpense(type, expense.id)); // 削除関数を呼び出す
                actionCell.appendChild(deleteButton);
            });
        };
        
        renderList('variable', 'expense-list-variable');
        renderList('fixed', 'expense-list-fixed');
    }

    // --- フォームと状態管理 ---
    function populateFormForEdit(type, id) {
        const data = loadData();
        const expense = data[type].find(exp => exp.id === id);
        if (!expense) return;

        // 編集対象のタイプ（変動費 or 固定費）にラジオボタンを合わせる
        document.getElementById(`type-${type}`).checked = true;
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

    // --- イベントハンドラ ---
    function handleFormSubmit(event) {
        event.preventDefault();
        const editId = document.getElementById('edit-id').value;
        const data = loadData();
        const type = document.querySelector('input[name="expense-type"]:checked').value;

        const expenseData = {
            id: editId || generateUniqueId(),
            date: document.getElementById('date').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            memo: document.getElementById('memo').value
        };

        if (!expenseData.date || isNaN(expenseData.amount) || expenseData.amount <= 0 || !expenseData.category) {
            alert('有効な日付、正の金額、カテゴリを入力してください。');
            return;
        }

        if (editId) {
            const expenseIndex = data[type].findIndex(exp => exp.id === editId);
            if (expenseIndex > -1) data[type][expenseIndex] = expenseData;
        } else {
            data[type].push(expenseData);
        }

        saveData(data);
        resetForm();
        renderAll();
    }

    function handleDeleteExpense(type, idToDelete) {
        if (!confirm('この支出を削除してもよろしいですか？')) return;

        const data = loadData();
        data[type] = data[type].filter(expense => expense.id !== idToDelete);
        saveData(data);
        renderAll();
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
    async function initialize() {
        document.getElementById('expense-form').addEventListener('submit', handleFormSubmit);
        document.getElementById('cancel-edit-button').addEventListener('click', resetForm);
        document.querySelectorAll('input[name="expense-type"]').forEach(radio => {
            radio.addEventListener('change', updateCategoryOptions);
        });
        
        document.getElementById('date').valueAsDate = new Date();
        updateCategoryOptions();
        setupTabs();
        await loadData(); //
        renderAll();
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
