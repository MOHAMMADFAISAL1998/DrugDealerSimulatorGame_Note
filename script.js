const itemGrid = document.getElementById('item-grid');
const totalGrams = document.getElementById('total-grams');
const filledCount = document.getElementById('filled-count');
const summaryInfo = document.getElementById('summary-info');
const statusList = document.getElementById('status-list');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');

const itemNames = [
    'MARIHUANA,Weed,Grass,Pot,Herb,Ganja',
    'AMPHETAMINE,Speed,Uppers,Goey,Adderall',
    'ECSTASY,MDMA,XTC,Molly,E,Rolls',
    'CRYSTAL METH,Ice,Shabu,Glass,Tina,Crank,Meth,Methamphetamine',
    'COCAINE,Blow,Coke,Sniff,Flake,White',
    'HEROIN,Smack,H,Dope,Junk,Skag',
    'LSD,Acid,Blotter,Lucy,Tab,Trips',
];

const STORAGE_KEY = 'orderListRequirements';

function createQuantityRow(name, value = 0, canRemove = false) {
    const row = document.createElement('div');
    row.className = 'quantity-row';

    row.innerHTML = `
        <label class="quantity-field">
            <span>Quantity</span>
            <input
                type="number"
                min="0"
                step="1"
                class="item-input"
                data-item="${name}"
                value="${value > 0 ? value : ''}"
                placeholder="0"
            />
        </label>
        <button type="button" class="btn btn-remove" data-remove="${name}">Remove</button>
    `;

    if (!canRemove) {
        row.querySelector('.btn-remove').style.visibility = 'hidden';
    }

    return row;
}

function buildOrderItems(orderData = {}) {
    itemGrid.innerHTML = '';

    itemNames.forEach(name => {
        const quantities = Array.isArray(orderData[name]) && orderData[name].length > 0 ? orderData[name] : [0];
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.item = name;

        const quantityList = document.createElement('div');
        quantityList.className = 'quantity-list';

        quantities.forEach((value, index) => {
            quantityList.appendChild(createQuantityRow(name, value, quantities.length > 1));
        });

        card.innerHTML = `
            <div class="item-label">
                <div>
                    <strong>${name}</strong>
                    <span>Enter multiple gram quantities</span>
                </div>
                <div class="item-total" data-total="${name}">0 g</div>
            </div>
            <div class="status-row item-status-row">
                <span class="status-chip status-none" data-status="${name}">No entry</span>
                <button type="button" class="btn btn-add" data-add="${name}">+ Add quantity</button>
            </div>
        `;

        card.appendChild(quantityList);
        itemGrid.appendChild(card);
    });
}

function getStatusClass(value) {
    if (!value || value === 0) return 'status-none';
    if (value <= 10) return 'status-low';
    if (value <= 30) return 'status-medium';
    return 'status-high';
}

function getStatusText(value) {
    if (!value || value === 0) return 'No entry';
    if (value <= 10) return 'Light';
    if (value <= 30) return 'Balanced';
    return 'Heavy';
}

function updateStatusElements() {
    const cards = Array.from(document.querySelectorAll('.item-card'));
    const currentData = {};
    let total = 0;
    let filled = 0;

    statusList.innerHTML = '';

    cards.forEach(card => {
        const name = card.dataset.item;
        const inputs = Array.from(card.querySelectorAll('.item-input'));
        const values = inputs.map(input => Number(input.value) || 0);
        const itemTotal = values.reduce((sum, v) => sum + v, 0);
        const status = getStatusClass(itemTotal);
        const statusText = getStatusText(itemTotal);

        const badge = card.querySelector(`[data-status="${name}"]`);
        badge.className = `status-chip ${status}`;
        badge.textContent = statusText;

        const totalBadge = card.querySelector(`[data-total="${name}"]`);
        totalBadge.textContent = `${itemTotal} g`;

        currentData[name] = values;

        if (itemTotal > 0) {
            total += itemTotal;
            filled += 1;
        }

        const row = document.createElement('div');
        row.className = 'status-row';
        row.innerHTML = `
            <div>${name}</div>
            <div>${itemTotal} g</div>
            <div class="status-chip ${status}">${statusText}</div>
        `;

        statusList.appendChild(row);
    });

    totalGrams.textContent = `${total} g`;
    filledCount.textContent = `${filled} / ${itemNames.length}`;
    summaryInfo.textContent = filled === itemNames.length ? 'All items have quantities entered.' : 'Add quantities for each item to complete the order.';

    return currentData;
}

function loadOrderData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveOrderData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function handleInputChange() {
    const data = updateStatusElements();
    saveOrderData(data);
}

function handleAddQuantity(name) {
    const card = document.querySelector(`.item-card[data-item="${name}"]`);
    const list = card.querySelector('.quantity-list');
    const currentRows = list.querySelectorAll('.quantity-row');
    list.appendChild(createQuantityRow(name, 0, true));

    if (currentRows.length === 1) {
        const removeBtn = list.querySelector('.btn-remove');
        if (removeBtn) removeBtn.style.visibility = 'visible';
    }
}

function handleRemoveQuantity(button) {
    const row = button.closest('.quantity-row');
    const list = row.closest('.quantity-list');
    row.remove();

    const itemRows = list.querySelectorAll('.quantity-row');
    if (itemRows.length === 1) {
        const onlyRemove = itemRows[0].querySelector('.btn-remove');
        if (onlyRemove) onlyRemove.style.visibility = 'hidden';
    }

    handleInputChange();
}

function handleSaveClick(event) {
    event.preventDefault();
    const data = updateStatusElements();
    saveOrderData(data);
    summaryInfo.textContent = 'Order saved locally. Reload will preserve your values.';
}

function handleClearClick(event) {
    event.preventDefault();
    const savedData = {};
    itemNames.forEach(name => {
        savedData[name] = [0];
    });
    buildOrderItems(savedData);
    updateStatusElements();
    localStorage.removeItem(STORAGE_KEY);
    summaryInfo.textContent = 'Order cleared. Start adding quantities.';
}

function initializeApp() {
    const savedData = loadOrderData();
    buildOrderItems(savedData);
    updateStatusElements();

    itemGrid.addEventListener('input', event => {
        if (event.target.matches('.item-input')) {
            handleInputChange();
        }
    });

    itemGrid.addEventListener('click', event => {
        if (event.target.matches('[data-add]')) {
            handleAddQuantity(event.target.dataset.add);
        }

        if (event.target.matches('[data-remove]')) {
            handleRemoveQuantity(event.target);
        }
    });

    saveBtn.addEventListener('click', handleSaveClick);
    clearBtn.addEventListener('click', handleClearClick);
}

initializeApp();
