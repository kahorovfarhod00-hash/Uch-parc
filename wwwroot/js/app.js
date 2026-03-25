var PRODUCT_TYPES = [];
var MATERIAL_TYPES = [
    { id: 1, name: 'Основа (бумага)', defect_percent: 5 },
    { id: 2, name: 'Основа (флизелин)', defect_percent: 3 },
    { id: 3, name: 'Покрытие (виниловое)', defect_percent: 7 },
    { id: 4, name: 'Покрытие (тканевое)', defect_percent: 8 }, 
    { id: 5, name: 'Краска', defect_percent: 2 }
];

var db_products = [];
var currentPage = 'list';
var currentProductId = null;
var editMode = false;

// ── ТОСТ-УВЕДОМЛЕНИЕ ─────────────────────────────────────────
function showToast(msg, type) {
    type = type || 'success';
    var colors = { success: '#2e7d32', error: '#c62828', info: '#1565c0' };
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:9999;padding:14px 24px;' +
        'border-radius:10px;font-size:15px;font-weight:600;color:#fff;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.25);opacity:0;transition:opacity 0.3s;' +
        'background:' + (colors[type] || colors.success);
    document.body.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '1'; }, 10);
    setTimeout(function () {
        toast.style.opacity = '0';
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}

// ── API ───────────────────────────────────────────────────────
function api_get(url, callback) {
    fetch(url)
        .then(function (r) { return r.json(); })
        .then(callback)
        .catch(function (e) { showToast('Ошибка загрузки: ' + e.message, 'error'); });
}

function api_post(url, data, callback) {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
            return r.json();
        })
        .then(callback)
        .catch(function (e) { showToast('Ошибка сохранения: ' + e.message, 'error'); });
}

function api_put(url, data, callback) {
    fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
            return r.json();
        })
        .then(function () { callback(); })
        .catch(function (e) { showToast('Ошибка обновления: ' + e.message, 'error'); });
}

function api_delete(url, callback) {
    fetch(url, { method: 'DELETE' })
        .then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.statusText); });
            return r.json();
        })
        .then(function () { callback(); })
        .catch(function (e) { showToast('Ошибка удаления: ' + e.message, 'error'); });
}

// ── НАВИГАЦИЯ ─────────────────────────────────────────────────
function navigate(page, opts) {
    opts = opts || {};
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById('page-' + page).classList.add('active');
    currentPage = page;
    var nav = document.getElementById('header-nav');
    nav.innerHTML = '';
    if (page !== 'list') {
        var btn = document.createElement('button');
        btn.className = 'header-back'; btn.textContent = '← Назад'; btn.onclick = goBack;
        nav.appendChild(btn);
    }
    if (page === 'list') { document.title = 'ОбойПром — Список продукции'; loadAndRenderProducts(); }
    else if (page === 'edit') { document.title = opts.edit ? 'ОбойПром — Редактирование' : 'ОбойПром — Добавление'; }
    else if (page === 'materials') { document.title = 'ОбойПром — Материалы'; renderMaterials(opts.product); }
}
function goBack() { navigate('list'); }

// ── СПИСОК ────────────────────────────────────────────────────
function loadAndRenderProducts() {
    api_get('/api/products', function (products) {
        db_products = products;
        renderStats();
        renderProducts();
    });
}

function calcProductCost(product) {
    if (!product.materials || !product.materials.length) return 0;
    var total = product.materials.reduce(function (s, m) { return s + m.qty * m.unit_price; }, 0);
    return Math.max(0, parseFloat(total.toFixed(2)));
}

function renderStats() {
    var total = db_products.length;
    var types = new Set(db_products.map(function (p) { return p.type_id; })).size;
    var avgCost = total ? (db_products.reduce(function (s, p) { return s + calcProductCost(p); }, 0) / total) : 0;
    document.getElementById('stats-row').innerHTML =
        '<div class="stat-card"><div class="stat-label">Продуктов</div><div class="stat-value">' + total + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Типов</div><div class="stat-value">' + types + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Средняя стоимость</div><div class="stat-value">' + avgCost.toFixed(2) + ' ₽</div></div>';
    api_get('/api/products/types', function (types_list) {
        PRODUCT_TYPES = types_list.map(function (t) { return { id: t.id, name: t.name, coefficient: t.coefficient }; });
        var sel = document.getElementById('filter-type');
        var cur = sel.value;
        sel.innerHTML = '<option value="">Все типы</option>';
        PRODUCT_TYPES.forEach(function (t) { sel.innerHTML += '<option value="' + t.id + '"' + (cur == t.id ? ' selected' : '') + '>' + t.name + '</option>'; });
    });
}

function filterProducts() {
    var q = document.getElementById('search-input').value.toLowerCase();
    var typeId = document.getElementById('filter-type').value;
    document.querySelectorAll('#products-tbody tr').forEach(function (row) {
        var pid = parseInt(row.dataset.pid);
        var p = db_products.find(function (x) { return x.id === pid; });
        if (!p) return;
        var matchQ = !q || p.name.toLowerCase().includes(q) || p.article.toLowerCase().includes(q);
        var matchT = !typeId || p.type_id == typeId;
        row.style.display = (matchQ && matchT) ? '' : 'none';
    });
}

function renderProducts() {
    var tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';
    db_products.forEach(function (p) {
        var cost = calcProductCost(p);
        var tr = document.createElement('tr');
        tr.dataset.pid = p.id;
        tr.innerHTML =
            '<td><code style="font-size:12px;color:var(--accent);">' + p.article + '</code></td>' +
            '<td><strong>' + p.name + '</strong></td>' +
            '<td><span class="badge">' + (p.type_name || '—') + '</span></td>' +
            '<td>' + parseFloat(p.min_cost).toFixed(2) + '</td>' +
            '<td>' + parseFloat(p.width).toFixed(2) + '</td>' +
            '<td class="cost-highlight">' + cost.toFixed(2) + '</td>' +
            '<td>' +
            '<button class="btn btn-secondary btn-sm" onclick="openMaterials(' + p.id + ');event.stopPropagation();">🧱 Материалы</button> ' +
            '<button class="btn btn-outline btn-sm" onclick="openEditProduct(' + p.id + ');event.stopPropagation();">✏️</button> ' +
            '<button class="btn btn-danger btn-sm" onclick="confirmDelete(' + p.id + ');event.stopPropagation();">🗑</button>' +
            '</td>';
        tr.addEventListener('click', function () { openEditProduct(p.id); });
        tbody.appendChild(tr);
    });
}

// ── ФОРМА ─────────────────────────────────────────────────────
function fillTypeSelects() {
    api_get('/api/products/types', function (types_list) {
        PRODUCT_TYPES = types_list.map(function (t) { return { id: t.id, name: t.name, coefficient: t.coefficient }; });
        var sel = document.getElementById('f-type');
        sel.innerHTML = '<option value="">— Выберите тип —</option>';
        PRODUCT_TYPES.forEach(function (t) { sel.innerHTML += '<option value="' + t.id + '">' + t.name + '</option>'; });
    });
}

function openAddProduct() {
    editMode = false; currentProductId = null;
    document.getElementById('edit-card-title').textContent = '➕ Добавление продукта';
    clearForm(); fillTypeSelects(); navigate('edit');
}

function openEditProduct(id) {
    var p = db_products.find(function (x) { return x.id === id; });
    if (!p) { showToast('Продукт не найден', 'error'); return; }
    editMode = true; currentProductId = id;
    document.getElementById('edit-card-title').textContent = '✏️ Редактирование: ' + p.name;
    clearForm(); fillTypeSelects();
    setTimeout(function () {
        document.getElementById('f-article').value = p.article;
        document.getElementById('f-type').value = p.type_id;
        document.getElementById('f-name').value = p.name;
        document.getElementById('f-min-cost').value = p.min_cost;
        document.getElementById('f-width').value = p.width;
        (p.materials || []).forEach(function (m) { addMaterialRow(m); });
    }, 150);
    navigate('edit', { edit: true });
}

function clearForm() {
    ['f-article', 'f-name', 'f-min-cost', 'f-width'].forEach(function (id) {
        document.getElementById(id).value = ''; document.getElementById(id).classList.remove('error');
    });
    document.getElementById('f-type').value = ''; document.getElementById('f-type').classList.remove('error');
    document.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('show'); });
    document.getElementById('materials-edit-tbody').innerHTML = '';
}

function addMaterialRow(m) {
    m = m || null;
    var tbody = document.getElementById('materials-edit-tbody');
    var typeOptions = MATERIAL_TYPES.map(function (t) {
        return '<option value="' + t.id + '"' + (m && m.material_type_id === t.id ? ' selected' : '') + '>' + t.name + '</option>';
    }).join('');
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td><select style="width:100%;padding:6px;font-size:13px;border:1px solid var(--border);border-radius:6px;background:var(--bg);"><option value="">— Выберите —</option>' + typeOptions + '</select></td>' +
        '<td><input type="number" step="0.01" min="0" value="' + (m ? m.qty : '') + '" placeholder="0.00" style="width:80px;padding:6px;font-size:13px;border:1px solid var(--border);border-radius:6px;background:var(--bg);" /></td>' +
        '<td><input type="number" step="0.01" min="0" value="' + (m ? m.unit_price : '') + '" placeholder="0.00" style="width:90px;padding:6px;font-size:13px;border:1px solid var(--border);border-radius:6px;background:var(--bg);" /></td>' +
        '<td><button type="button" onclick="this.closest(\'tr\').remove()" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:18px;">✕</button></td>';
    tbody.appendChild(tr);
}

function getMaterialsFromForm() {
    var rows = document.querySelectorAll('#materials-edit-tbody tr');
    var materials = [];
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i]; var sel = row.querySelector('select'); var inputs = row.querySelectorAll('input');
        var type_id = parseInt(sel.value); var qty = parseFloat(inputs[0].value);
        if (!type_id) continue;
        if (isNaN(qty) || qty < 0) return null;
        materials.push({ materialTypeId: type_id, qty: qty });
    }
    return materials;
}

function saveProduct() {
    var valid = true;
    var article = document.getElementById('f-article').value.trim();
    var type_id = parseInt(document.getElementById('f-type').value);
    var name = document.getElementById('f-name').value.trim();
    var min_cost = parseFloat(document.getElementById('f-min-cost').value);
    var width = parseFloat(document.getElementById('f-width').value);

    function setErr(fieldId, errId, condition) {
        var el = document.getElementById(fieldId); var err = document.getElementById(errId);
        if (condition) { el.classList.add('error'); err.classList.add('show'); valid = false; }
        else { el.classList.remove('error'); err.classList.remove('show'); }
    }
    setErr('f-article', 'err-article', !article);
    setErr('f-type', 'err-type', !type_id);
    setErr('f-name', 'err-name', !name);
    setErr('f-min-cost', 'err-min-cost', isNaN(min_cost) || min_cost < 0);
    setErr('f-width', 'err-width', isNaN(width) || width < 0);

    var materials = getMaterialsFromForm();
    if (materials === null) { showToast('Количество материала должно быть >= 0', 'error'); return; }
    if (!valid) { showToast('Исправьте поля, отмеченные красным', 'error'); return; }

    var dto = { article: article, name: name, typeId: type_id, minCost: min_cost, width: width, materials: materials };

    if (editMode) {
        api_put('/api/products/' + currentProductId, dto, function () {
            showToast('✅ Продукт «' + name + '» был обновлён', 'success');
            navigate('list');
        });
    } else {
        api_post('/api/products', dto, function () {
            showToast('✅ Продукт «' + name + '» был добавлен', 'success');
            navigate('list');
        });
    }
}

// ── УДАЛЕНИЕ ──────────────────────────────────────────────────
function confirmDelete(id) {
    var p = db_products.find(function (x) { return x.id === id; });
    if (!p) return;
    showModal('warn', 'Подтверждение удаления', 'Вы собираетесь удалить «' + p.name + '». Это действие необратимо.',
        function () {
            api_delete('/api/products/' + id, function () {
                showToast('🗑 Продукт «' + p.name + '» был удалён', 'success');
                navigate('list');
            });
        }, true);
}

// ── МАТЕРИАЛЫ ─────────────────────────────────────────────────
function openMaterials(id) {
    var p = db_products.find(function (x) { return x.id === id; });
    if (!p) return;
    navigate('materials', { product: p });
}

function renderMaterials(p) {
    if (!p) { goBack(); return; }
    document.getElementById('materials-card-title').textContent = '🧱 Материалы: ' + p.name;
    document.getElementById('materials-product-info').innerHTML =
        '<strong>Артикул:</strong> ' + p.article + ' &nbsp;|&nbsp; <strong>Тип:</strong> ' + (p.type_name || '—') + ' &nbsp;|&nbsp; <strong>Ширина:</strong> ' + parseFloat(p.width).toFixed(2) + ' м';
    var tbody = document.getElementById('materials-tbody');
    tbody.innerHTML = '';
    var total = 0;
    (p.materials || []).forEach(function (m) {
        var sum = m.qty * m.unit_price; total += sum;
        var mt = MATERIAL_TYPES.find(function (t) { return t.id === m.material_type_id; });
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><strong>' + m.name + '</strong></td><td>' + (mt ? mt.name : '—') + '</td><td>' + parseFloat(m.qty).toFixed(2) + '</td><td>' + parseFloat(m.unit_price).toFixed(2) + '</td><td><strong>' + sum.toFixed(2) + '</strong></td>';
        tbody.appendChild(tr);
    });
    document.getElementById('materials-total').innerHTML = '<span>Итого: </span><span class="cost-highlight">' + Math.max(0, total).toFixed(2) + ' ₽</span>';
    document.getElementById('calc-product-type').value = p.type_id;
}

// ── РАСЧЁТ ЗАКУПКИ ────────────────────────────────────────────
function calc_material_purchase(product_type_id, material_type_id, quantity, param1, param2, stock_amount) {
    var product_type = PRODUCT_TYPES.find(function (t) { return t.id === product_type_id; });
    var material_type = MATERIAL_TYPES.find(function (t) { return t.id === material_type_id; });
    if (!product_type || !material_type) return -1;
    if (!Number.isInteger(quantity) || quantity <= 0) return -1;
    if (param1 <= 0 || param2 <= 0) return -1;
    if (stock_amount < 0) return -1;
    var material_per_unit = param1 * param2 * product_type.coefficient;
    var total_with_defect = material_per_unit * quantity * (1 + (material_type.defect_percent / 100));
    var to_purchase = total_with_defect - stock_amount;
    if (to_purchase <= 0) return 0;
    return Math.ceil(to_purchase);
}

function runCalc() {
    var product_type_id = parseInt(document.getElementById('calc-product-type').value);
    var material_type_id = parseInt(document.getElementById('calc-material-type').value);
    var qty = parseInt(document.getElementById('calc-qty').value);
    var param1 = parseFloat(document.getElementById('calc-param1').value);
    var param2 = parseFloat(document.getElementById('calc-param2').value);
    var stock = parseFloat(document.getElementById('calc-stock').value || '0');
    var result = calc_material_purchase(product_type_id, material_type_id, qty, param1, param2, stock);
    var div = document.getElementById('calc-result');
    div.style.display = 'block';
    if (result === -1) { div.innerHTML = '<span style="color:var(--danger);font-weight:700;">Ошибка расчёта.</span> Проверьте данные.'; return; }
    var pt = PRODUCT_TYPES.find(function (t) { return t.id === product_type_id; });
    var mt = MATERIAL_TYPES.find(function (t) { return t.id === material_type_id; });
    div.innerHTML = '<div><strong>Тип продукции:</strong> ' + (pt ? pt.name : '—') + '</div>' +
        '<div><strong>Тип материала:</strong> ' + (mt ? mt.name : '—') + ' (% брака: ' + (mt ? mt.defect_percent : '—') + '%)</div>' +
        '<div style="margin-top:12px;font-size:20px;">Необходимо закупить: <span class="cost-highlight">' + result + ' ед.</span></div>';
}

// ── МОДАЛЬНОЕ ОКНО ────────────────────────────────────────────
function showModal(type, title, msg, on_confirm, show_cancel) {
    on_confirm = on_confirm || null; show_cancel = show_cancel || false;
    var icons = { error: '❌', warn: '⚠️', info: 'ℹ️' };
    document.getElementById('modal-icon').textContent = icons[type] || 'ℹ️';
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent = msg;
    var actions = document.getElementById('modal-actions');
    actions.innerHTML = '';
    if (show_cancel) { var cb = document.createElement('button'); cb.className = 'btn btn-outline'; cb.textContent = 'Отмена'; cb.onclick = closeModal; actions.appendChild(cb); }
    var ob = document.createElement('button');
    ob.className = type === 'error' ? 'btn btn-danger' : (type === 'warn' ? 'btn btn-secondary' : 'btn btn-primary');
    ob.textContent = show_cancel ? 'Удалить' : 'ОК';
    ob.onclick = function () { closeModal(); if (on_confirm) on_confirm(); };
    actions.appendChild(ob);
    document.getElementById('modal-overlay').classList.add('show');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); }
document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target === this) closeModal(); });

navigate('list');
