const firebaseConfig = {
    apiKey: "AIzaSyBR83SJnuVtaoGKZ6LYKEQkzK4yQtWLOF0",
    authDomain: "ql-sale.firebaseapp.com",
    databaseURL: "https://ql-sale-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ql-sale",
    storageBucket: "ql-sale.firebasestorage.app",
    messagingSenderId: "374149663544",
    appId: "1:374149663544:web:f1fd9b0ad23d9aece44fcd",
    measurementId: "G-G02MNTRZJ6"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let employeeId = localStorage.getItem('v11_employee_id');
let userRef;

const DEFAULT_PASSWORD = "898989";

// ==========================================
// HỆ THỐNG CUSTOM MODAL (THÔNG BÁO TÙY CHỈNH)
// ==========================================

function showCustomAlert(message, type = 'info') {
    const modal = document.getElementById('customAlertModal');
    const iconDiv = document.getElementById('customAlertIcon');
    const titleEl = document.getElementById('customAlertTitle');
    const messageEl = document.getElementById('customAlertMessage');

    let iconHtml = '';
    let titleClass = '';
    let iconBgClass = '';
    let titleText = 'Thông báo';

    switch(type) {
        case 'success':
            iconHtml = '<i class="fa-solid fa-circle-check"></i>';
            titleClass = 'text-emerald-600';
            iconBgClass = 'bg-emerald-50 text-emerald-500 border-emerald-100';
            titleText = 'Thành công';
            break;
        case 'error':
            iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
            titleClass = 'text-red-600';
            iconBgClass = 'bg-red-50 text-red-500 border-red-100';
            titleText = 'Lỗi hệ thống';
            break;
        case 'warning':
            iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
            titleClass = 'text-amber-600';
            iconBgClass = 'bg-amber-50 text-amber-500 border-amber-100';
            titleText = 'Cảnh báo';
            break;
        default:
            iconHtml = '<i class="fa-solid fa-circle-info"></i>';
            titleClass = 'text-[#034C5F]';
            iconBgClass = 'bg-[#FDF5F4] text-[#034C5F] border-[#F9C4BA]';
            titleText = 'Thông báo';
    }

    iconDiv.className = `w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner border ${iconBgClass}`;
    iconDiv.innerHTML = iconHtml;
    titleEl.className = `text-xl font-black mb-2 uppercase ${titleClass}`;
    titleEl.innerText = titleText;
    messageEl.innerText = message;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);
}

window.closeCustomAlert = function() {
    const modal = document.getElementById('customAlertModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.remove('scale-100');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

function showCustomConfirm(message, onConfirmCallback) {
    const modal = document.getElementById('customConfirmModal');
    const messageEl = document.getElementById('customConfirmMessage');
    const btnCancel = document.getElementById('customConfirmCancel');
    const btnOk = document.getElementById('customConfirmOk');

    messageEl.innerText = message;

    // Reset sự kiện click cũ
    const newBtnCancel = btnCancel.cloneNode(true);
    const newBtnOk = btnOk.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.remove('scale-100');
        modal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    newBtnCancel.addEventListener('click', closeModal);
    newBtnOk.addEventListener('click', () => {
        closeModal();
        if(onConfirmCallback) onConfirmCallback();
    });

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);
}

// ==========================================

async function handleLogin() {
    const code = document.getElementById('empCode').value.trim().toUpperCase();
    const pass = document.getElementById('empPassword').value;

    if (!code || !pass) {
        showCustomAlert("Vui lòng nhập đầy đủ mã và mật khẩu!", "warning");
        return;
    }

    try {
        const snapshot = await db.ref('SunsetShopData/Employees/' + code + '/password').once('value');
        const savedPassword = snapshot.val() || "898989"; 

        if (pass === savedPassword) {
            employeeId = code; 
            localStorage.setItem('v11_employee_id', employeeId);
            userRef = db.ref('SunsetShopData/Employees/' + employeeId);
            listenToUserProfile(); 
            initDataSync(); 
            document.getElementById('loginModal').classList.add('hidden');
        } else {
            showCustomAlert("Mã nhân viên hoặc mật khẩu không chính xác!", "error");
        }
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        showCustomAlert("Có lỗi kết nối: " + error.message, "error");
    }
}

function handleForgotPassword() {
    const code = document.getElementById('empCode').value.trim();
    if (!code) {
        showCustomAlert("Vui lòng điền Mã nhân viên ở ô phía trên trước để khôi phục mật khẩu!", "warning");
        return;
    }
    document.getElementById('supplierCodeInput').value = '';
    document.getElementById('newResetPassInput').value = '';
    document.getElementById('forgotPassModal').classList.remove('hidden');
}

function closeForgotPassModal() {
    document.getElementById('forgotPassModal').classList.add('hidden');
}

function submitForgotPassword() {
    const code = document.getElementById('empCode').value.trim().toUpperCase();
    const supplierCode = document.getElementById('supplierCodeInput').value;
    const newPass = document.getElementById('newResetPassInput').value;

    if (supplierCode !== 'admin123') {
        showCustomAlert("Mã xác thực của nhà cung cấp không chính xác!", "error");
        return;
    }

    if (!newPass) {
        showCustomAlert("Vui lòng nhập mật khẩu mới mà bạn muốn đổi!", "warning");
        return;
    }

    db.ref('SunsetShopData/Employees/' + code + '/password').set(newPass)
        .then(() => {
            showCustomAlert(`Thành công! Mật khẩu của nhân viên ${code} đã được đổi. Vui lòng đăng nhập lại.`, "success");
            closeForgotPassModal();
            document.getElementById('empPassword').value = ''; 
        })
        .catch((error) => {
            showCustomAlert("Lỗi khi cấp lại mật khẩu: " + error.message, "error");
        });
}

function openRegisterModal() {
    document.getElementById('regAdminCode').value = '';
    document.getElementById('regEmpCode').value = '';
    document.getElementById('regEmpPassword').value = '';
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('hidden');
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('hidden');
}

async function submitRegister() {
    const adminCode = document.getElementById('regAdminCode').value;
    const newCode = document.getElementById('regEmpCode').value.trim().toUpperCase();
    const newPass = document.getElementById('regEmpPassword').value;

    if (adminCode !== 'admin123') {
        showCustomAlert("Mã xác thực Admin không chính xác. Bạn không có quyền tạo tài khoản!", "error");
        return;
    }

    if (!newCode || !newPass) {
        showCustomAlert("Vui lòng điền đầy đủ Mã nhân viên và Mật khẩu!", "warning");
        return;
    }

    try {
        const userNodeRef = db.ref('SunsetShopData/Employees/' + newCode);
        const snapshot = await userNodeRef.once('value');
        if (snapshot.exists()) {
            showCustomAlert("Mã nhân viên này đã tồn tại! Vui lòng chọn mã khác.", "error");
            return;
        }

        await userNodeRef.set({
            password: newPass,
            created_at: new Date().toISOString(),
            status: "active"
        });

        showCustomAlert(`Tạo tài khoản thành công cho nhân viên: ${newCode}!\nBây giờ bạn có thể đăng nhập.`, "success");
        closeRegisterModal();
        document.getElementById('empCode').value = newCode;
        document.getElementById('empPassword').value = '';

    } catch (error) {
        showCustomAlert("Có lỗi xảy ra khi tạo tài khoản: " + error.message, "error");
    }
}

function handleLogout() {
    showCustomConfirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản nhân viên hiện tại?\n(Bạn sẽ cần nhập mã mới để vào lại hệ thống)", () => {
        localStorage.removeItem('v11_employee_id');
        window.location.reload();
    });
}

function initDataSync() {
    userRef = db.ref('SunsetShopData/Employees/' + employeeId);
    listenToUserProfile(); 

    userRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        let rawOrders = data.v11_orders || {};
        orders = Object.values(rawOrders).sort((a, b) => b.timestamp - a.timestamp);

        let rawCust = data.v11_customers || {};
        customers = {};
        for (let key in rawCust) {
            if (rawCust[key] !== null && rawCust[key] !== undefined) {
                customers[key] = rawCust[key];
            }
        }

        inventory = data.v11_inventory || [];
        cvAccumulations = data.v11_cv_accumulations || [];
        cvMonthlyStats = data.v11_cv_monthly || {};

        // --- ĐIỂM THAY ĐỔI CHÍNH ---
        // Nếu ĐANG LÀ thao tác cục bộ (đổi trạng thái/đã thu tiền) thì BỎ QUA lệnh vẽ lại bảng
        if (!isLocalAction) {
            renderTable();
        }
        // ---------------------------

        renderCustomerCRM();
        renderInventory();
        
        // Cũng có thể chặn luôn việc vẽ lại chart nếu đang thao tác cục bộ để mượt hơn
        if(!document.getElementById('view-analytics').classList.contains('hidden') && !isLocalAction) {
            renderAnalytics();
        }
        
        if(!document.getElementById('view-cv').classList.contains('hidden')) renderAllCV();

        checkAndShowEvents();
    });
}


document.addEventListener('DOMContentLoaded', () => {
    if (!employeeId) {
        document.getElementById('loginModal').classList.remove('hidden');
    } else {
        initDataSync();
    }
});

const OUT_KEYWORDS = ['BND', 'BNĐ', 'NƯỚC HOA', 'SERUM'];

let orders = [];
let customers = {};
let inventory = [];
let revenueChartInstance = null;
let cvAccumulations = [];
let cvMonthlyStats = {};
let isLocalAction = false; // Biến cờ chặn render lại bảng khi thao tác cục bộ

const formatMoney = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
function formatCurrencyInput(input) { let value = input.value.replace(/\D/g, ""); if (value !== "") { input.value = new Intl.NumberFormat('en-US').format(value); } else { input.value = ""; } }
function parseCurrency(str) { if (!str) return 0; return parseInt(String(str).replace(/\D/g, ""), 10) || 0; }

function backupData() {
    if(!employeeId) return;
    const data = { version: "11.0", timestamp: new Date().toISOString(), orders, customers, inventory, cvAccumulations, cvMonthlyStats };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `SunsetShop_${employeeId}_BACKUP_${new Date().toISOString().slice(0,10)}.json`; a.click();
    showToast("Đã tải xuống file sao lưu!");
}

function restoreData(input) {
    if(!employeeId) return;
    const file = input.files[0];
    if (!file) return;

    showCustomConfirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè. Hãy chắc chắn bạn đã sao lưu trước đó!", () => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.orders && data.customers) {
                    userRef.child('v11_orders').set(data.orders);
                    userRef.child('v11_customers').set(data.customers);
                    if(data.inventory) userRef.child('v11_inventory').set(data.inventory);
                    if(data.cvAccumulations) userRef.child('v11_cv_accumulations').set(data.cvAccumulations);
                    if(data.cvMonthlyStats) userRef.child('v11_cv_monthly').set(data.cvMonthlyStats);
                    showCustomAlert("Khôi phục thành công! Hệ thống đang tự động đồng bộ.", "success"); 
                } else {
                    showCustomAlert("File không hợp lệ hoặc cấu trúc lỗi.", "error");
                }
            } catch (err) { 
                showCustomAlert("Lỗi đọc file: " + err.message, "error"); 
            }
        };
        reader.readAsText(file);
    });
    input.value = ''; 
}

function saveInventory() { userRef.child('v11_inventory').set(inventory); }
function addInventoryProduct() {
    const name = document.getElementById('invName').value.trim();
    const price = parseCurrency(document.getElementById('invPrice').value);
    const qty = parseInt(document.getElementById('invQty').value) || 0;
    if(!name) return showToast("Nhập tên sản phẩm!");
    const existing = inventory.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(existing) return showCustomAlert("Sản phẩm đã tồn tại trong kho!", "warning");
    inventory.push({ name, price: price || 0, qty: qty });
    document.getElementById('invName').value = '';
    document.getElementById('invPrice').value = '';
    document.getElementById('invQty').value = '';
    saveInventory();
    showToast("Đã nhập kho!");
}

function updateInventoryProduct(index, field, value) {
    if(field === 'qty') inventory[index].qty = parseInt(value) || 0;
    else if(field === 'price') inventory[index].price = parseCurrency(value) || 0;
    else inventory[index][field] = value;
    saveInventory();
}

function deleteInventoryProduct(index) { 
    showCustomConfirm("Xóa sản phẩm này khỏi kho?", () => {
        inventory.splice(index, 1); 
        saveInventory();
        showToast("Đã xóa khỏi kho!");
    }); 
}

function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    const filterElement = document.getElementById('inventoryFilter');
    const filterMode = filterElement ? filterElement.value : 'all';
    let html = '';
    inventory.forEach((p, originalIdx) => {
        const isOut = OUT_KEYWORDS.some(k => p.name.toUpperCase().includes(k));
        if (filterMode === 'out' && !isOut) return;
        if (filterMode === 'vnl' && isOut) return;
        const isLow = p.qty <= 5;
        const stockClass = isLow ? "stock-low" : "stock-ok";
        html += `
        <tr class="hover:bg-white transition-colors">
            <td class="p-3"><input type="text" value="${p.name}" onchange="updateInventoryProduct(${originalIdx}, 'name', this.value)" class="crm-input font-bold text-[#034C5F]"></td>
            <td class="p-3"><input type="text" inputmode="numeric" value="${new Intl.NumberFormat('en-US').format(p.price)}" oninput="formatCurrencyInput(this)" onchange="updateInventoryProduct(${originalIdx}, 'price', this.value)" class="crm-input text-[#EE6457]"></td>
            <td class="p-3 text-center"><input type="number" value="${p.qty}" onchange="updateInventoryProduct(${originalIdx}, 'qty', this.value)" class="crm-input text-center ${stockClass}" style="font-size:14px;"></td>
            <td class="p-3 text-right"><button onclick="deleteInventoryProduct(${originalIdx})" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function updateQty(btn, change) {
    const input = btn.parentElement.querySelector('.p-qty');
    let currentVal = parseInt(input.value) || 0;
    let newVal = currentVal + change;
    if (newVal < 1) newVal = 1; 
    input.value = newVal;
    calculateTotal();
}

function addProductRow(name = "", price = "", qty = 1) {
    const container = document.getElementById('product-list');
    if (!container) return; 

    const div = document.createElement('div');
    const formattedPrice = price ? new Intl.NumberFormat('en-US').format(price) : "";
    
    div.className = "grid grid-cols-1 sm:grid-cols-[2fr,1fr,auto,auto] gap-2 bg-white p-3 border border-soft-pink rounded-xl items-center shadow-sm product-row";
    
    div.innerHTML = `
        <div class="input-group relative">
            <i class="fa-solid fa-cube input-icon"></i>
            <input type="text" autocomplete="off" class="form-input p-name" placeholder="Tên SP..." value="${name}">
            <div class="custom-suggestion-box product-suggestions"></div>
        </div>
        <div class="input-group">
            <i class="fa-solid fa-money-bill-1-wave input-icon"></i>
            <input type="text" inputmode="numeric" class="form-input p-price font-bold text-[#034C5F]" placeholder="Giá (₫)" value="${formattedPrice}" oninput="formatCurrencyInput(this); calculateTotal()">
        </div>
        <div class="flex items-center gap-2 bg-[#FDF5F4] p-1 rounded-lg border border-[#F9C4BA]">
            <button type="button" onclick="updateQty(this, -1)" class="w-8 h-8 flex items-center justify-center text-[#EE6457] font-bold hover:bg-white rounded-md transition-colors">-</button>
            <input type="number" class="w-10 text-center bg-transparent font-black text-[#034C5F] outline-none p-qty" value="${qty}" onchange="calculateTotal()" min="1">
            <button type="button" onclick="updateQty(this, 1)" class="w-8 h-8 flex items-center justify-center text-[#034C5F] font-bold hover:bg-white rounded-md transition-colors">+</button>
        </div>
        <button type="button" onclick="this.parentElement.remove(); calculateTotal()" class="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

function autoFillProductPrice(inputElement) {
    const val = inputElement.value;
    const pName = inventory.find(p => p.name === val) ? val : inventory.find(p => inputElement.value.includes(p.name))?.name;
    if(pName) {
        const product = inventory.find(p => p.name === pName);
        if (product) {
            inputElement.value = product.name;
            const row = inputElement.closest('.product-row');
            row.querySelector('.p-price').value = new Intl.NumberFormat('en-US').format(product.price);
            calculateTotal();
        }
    }
}

function calculateTotal() {
    let subtotal = 0;
    const nameInputs = document.querySelectorAll('.p-name');
    const priceInputs = document.querySelectorAll('.p-price');
    const qtyInputs = document.querySelectorAll('.p-qty');

    nameInputs.forEach((el, idx) => {
        const price = parseCurrency(priceInputs[idx].value) || 0;
        const qty = parseFloat(qtyInputs[idx].value) || 0;
        
        if (el.value) { 
            subtotal += price * qty;
        }
    });

    const ship = parseCurrency(document.getElementById('shipFee').value) || 0;
    const dVal = parseCurrency(document.getElementById('discountVal').value) || 0;
    const dType = document.getElementById('discountType').value;
    
    let disc = dType === 'percent' ? subtotal * (dVal/100) : dVal;
    let total = Math.max(0, subtotal - disc + ship);
    
    document.getElementById('finalTotal').innerText = formatMoney(total);
    
    return { subtotal, total };
}

function saveOrder() {
    const phone = document.getElementById('custPhone').value.trim();
    const name = document.getElementById('custName').value.trim();
    const addr = document.getElementById('custAddr').value;
    const type = document.getElementById('custType').value;
    const isEdit = document.getElementById('editOrderId').value !== "";
    
    if(!phone || !name) return showCustomAlert("Vui lòng nhập Tên hoặc SĐT!", "warning");
    
    let products = [];
    let valid = true;

    document.querySelectorAll('.product-row').forEach((row) => {
        const nameInput = row.querySelector('.p-name').value;
        const priceInput = row.querySelector('.p-price').value;
        const qtyInput = parseInt(row.querySelector('.p-qty').value) || 1;
        
        if(!nameInput || !priceInput) {
            valid = false;
        } else {
            products.push({ 
                name: nameInput, 
                price: parseCurrency(priceInput) || 0, 
                qty: qtyInput 
            });
        }
    });

    if(!valid || products.length === 0) return showCustomAlert("Kiểm tra lại thông tin sản phẩm!", "warning");
    
    if (!isEdit) {
        products.forEach(p => {
            const invItem = inventory.find(i => i.name.toLowerCase() === p.name.toLowerCase());
            if (invItem) invItem.qty = Math.max(0, invItem.qty - p.qty);
            else inventory.push({ name: p.name, price: p.price, qty: 0 });
        });
    }
    
    if(!customers[phone]) {
        customers[phone] = { name, address: addr, birthday: '', job: '', note: '', anniversary: document.getElementById('orderDate').value, status: 'Vãn lai', timestamp: Date.now() };
    } else { 
        customers[phone].name = name; 
        customers[phone].address = addr; 
        if (!customers[phone].anniversary) {
            customers[phone].anniversary = document.getElementById('orderDate').value;
        }
    }

    const { subtotal, total } = calculateTotal();
    const id = isEdit ? parseInt(document.getElementById('editOrderId').value) : Date.now();
    const existingOrder = isEdit ? orders.find(x => x.id == id) : null;

    const order = { 
        id, 
        timestamp: Date.now(), // Cập nhật thời gian hiện tại để đưa lên đầu danh sách
        customer: { name, phone, addr, type }, 
        products, 
        payMethod: document.getElementById('payMethod').value, 
        shipFee: parseFloat(document.getElementById('shipFee').value) || 0, 
        discount: { 
            val: parseFloat(document.getElementById('discountVal').value) || 0, 
            type: document.getElementById('discountType').value 
        }, 
        orderDate: document.getElementById('orderDate').value,
        date: document.getElementById('shipDate').value, 
        deliveryDate: document.getElementById('deliveryDate').value, 
        note: document.getElementById('orderNote').value.trim(), 
        subtotal, 
        total, 
        status: existingOrder ? existingOrder.status : "Đợi gửi",
        isPaid: existingOrder ? (existingOrder.isPaid || false) : false 
    };

    if (isEdit) {
        const index = orders.findIndex(x => x.id === id);
        if (index !== -1) orders[index] = order;
    } else {
        orders.unshift(order); 
    }

    // Tự động sort mảng hiển thị lên đầu ngay lập tức
    orders.sort((a, b) => b.timestamp - a.timestamp);

    let updates = {};
    updates[`v11_orders/${id}`] = order;
    updates[`v11_customers/${phone}`] = customers[phone];
    updates[`v11_inventory`] = inventory;

    userRef.update(updates)
        .then(() => {
            resetForm(); 
            renderTable(); 
            showToast("Đã lưu đồng bộ thành công!");
        })
        .catch((error) => {
            showCustomAlert("Có lỗi khi lưu đơn hàng: " + error.message, "error");
        });
}

function addManualCustomer() {
    const phone = document.getElementById('newCustPhone').value.trim();
    const name = document.getElementById('newCustName').value.trim();
    const addr = document.getElementById('newCustAddr').value.trim();
    if (!phone || !name) return showToast("Vui lòng nhập đầy đủ Tên và Số điện thoại!");
    if (customers[phone]) return showToast("Khách hàng với SĐT này đã tồn tại!");
    customers[phone] = { name: name, address: addr, birthday: '', job: '', note: '', anniversary: '', status: 'Vãn lai', timestamp: Date.now() };
    saveCRM();
    document.getElementById('newCustPhone').value = ''; document.getElementById('newCustName').value = ''; document.getElementById('newCustAddr').value = '';
    showToast("Đã thêm khách hàng mới thành công!");
}

function renderTable() {
    const fStart = document.getElementById('listFilterStart').value;
    const fEnd = document.getElementById('listFilterEnd').value;
    const fType = document.getElementById('listFilterType').value;
    const search = document.getElementById('searchOrderInput').value.toLowerCase();
    
    let filtered = orders.filter(o => {
        const targetDate = o.orderDate || o.date;
        const dateMatch = (!fStart || targetDate >= fStart) && (!fEnd || targetDate <= fEnd);
        const typeMatch = (fType === 'all' || o.customer.type === fType);
        const searchMatch = !search || o.customer.name.toLowerCase().includes(search) || o.customer.phone.includes(search);
        return dateMatch && typeMatch && searchMatch;
    });
    
    // ÉP BUỘC SẮP XẾP TẠI ĐÂY LÚC HIỂN THỊ
    // Lấy thời gian lưu (timestamp), nếu dữ liệu cũ không có thì lấy mã đơn (id)
    filtered.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));

    document.getElementById('orderTableBody').innerHTML = filtered.map(o => {
        const formattedShipDate = o.date ? o.date.split('-').reverse().join('/') : '';
        let shortPayMethod = "COD";
        if (o.payMethod === "Chuyển khoản") shortPayMethod = "CK";
        else if (o.payMethod === "Tiền mặt") shortPayMethod = "TM";

        let paidStyle = o.isPaid 
    ? "background-color: #10b981; border-color: #059669; color: #ffffff;"
    : "background-color: #f1f5f9; border-color: #e2e8f0; color: #94a3b8;";

        let shipDateStyle = o.status === 'Đợi gửi' 
            ? "bg-[#EE6457]/10 text-[#EE6457] border border-[#EE6457]/30" 
            : "bg-slate-100 text-slate-400 border border-slate-200 opacity-60"; 

        return `
        <tr class="hover:bg-[#FDF5F4]/50 transition-colors">
            <td class="p-4">
                <div class="flex items-start gap-2">
                    <div>
                        <b>${o.customer.name}</b> 
                        <span class="text-[9px] px-1.5 py-0.5 rounded ${o.customer.type === 'ttd' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} font-bold uppercase ml-1">${o.customer.type === 'ttd' ? 'TTD' : 'Mới'}</span>
                        <br><span class="text-xs text-[#97BEC6]">${o.customer.phone}</span>
                    </div>
                    <button onclick="copyCustomerInfo('${o.customer.name.replace(/'/g, "\\'")}', '${o.customer.phone}', '${o.customer.addr.replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
                        <i class="fa-solid fa-copy text-[10px]"></i>
                    </button>
                </div>
            </td>
            <td class="p-4 text-xs text-slate-500 line-clamp-1">${o.products.map(p => `${p.name} (x${p.qty})`).join(', ')}</td>
            <td class="p-4 text-center">
                    <span id="ship-badge-${o.id}" class="${shipDateStyle} font-black px-3 py-1 rounded-lg text-[11px] shadow-sm whitespace-nowrap transition-all">
                    <i class="fa-solid fa-truck-fast mr-1"></i>${formattedShipDate}
                </span>
            </td>

            <td class="p-4 text-center font-black text-[#034C5F] text-xs">
                ${shortPayMethod}
            </td>
        <td class="p-4 text-center">
        <select onchange="changeOrderStatus('${o.id}', this.value)" 
            class="text-[11px] font-bold rounded-full px-3 py-1 cursor-pointer transition-all appearance-none border-none outline-none focus:ring-0"
            style="
                background-color: ${getStatusStyles(o.status).bg} !important; 
                color: ${getStatusStyles(o.status).text} !important;
                text-align: center;
                width: auto;
                min-width: 100px;
            ">
            <option value="Đợi gửi" ${o.status === 'Đợi gửi' ? 'selected' : ''} style="background: white; color: #000000;">Đợi gửi</option>
            <option value="Đang giao" ${o.status === 'Đang giao' ? 'selected' : ''} style="background: white; color: #1e40af;">Đang giao 🚚</option>
            <option value="Thành công" ${o.status === 'Thành công' ? 'selected' : ''} style="background: white; color: #065f46;">Thành công ✅</option>
            <option value="Chăm sóc" ${o.status === 'Chăm sóc' ? 'selected' : ''} style="background: white; color: #5b21b6;">Chăm sóc 💬</option>
            <option value="HD sử dụng" ${o.status === 'HD sử dụng' ? 'selected' : ''} style="background: white; color: #92400e;">HD sử dụng 📖</option>
            <option value="Xử lý" ${o.status === 'Xử lý' ? 'selected' : ''} style="background: white; color: #991b1b;">Xử lý ⚙️</option>
            <option value="Đơn BOM 💣" ${o.status === 'Đơn BOM 💣' ? 'selected' : ''} style="background: white; color: #7f1d1d;">Đơn Bom 💣</option>
            <option value="Đã Hủy" ${o.status === 'Đã Hủy' ? 'selected' : ''} style="background: white; color: #374151;">Đã Hủy ❌</option>
        </select>
    </td>

            <td class="p-4 text-right font-bold text-[#EE6457]">${formatMoney(o.total)}</td>
           <td class="p-4 text-center">
                <button onclick="togglePaidStatus('${o.id}')" 
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-110 shadow-sm mx-auto" 
                    style="${paidStyle}" title="Đánh dấu đã thu tiền">
                    <i class="fa-solid fa-check text-sm"></i>
                </button>
            </td>
            <td class="p-4 text-center">
                <div class="flex justify-center gap-3">
                    <button onclick="openInvoice('${o.id}')" class="text-[#97BEC6] hover:text-[#034C5F]"><i class="fa-solid fa-receipt text-lg"></i></button>
                    <button onclick="editOrder('${o.id}')" class="text-[#97BEC6] hover:text-[#034C5F]"><i class="fa-solid fa-pen-to-square text-lg"></i></button>
                    <button onclick="deleteOrder('${o.id}')" class="text-slate-200 hover:text-red-400"><i class="fa-solid fa-trash text-lg"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function changeOrderStatus(id, newStatus) {
    const index = orders.findIndex(o => o.id == id);
    
    if (index !== -1) {
        orders[index].status = newStatus;
          
        // 1. CẬP NHẬT DOM CỤC BỘ (Đã có sẵn trong code của bạn)
        const selectEl = document.querySelector(`select[onchange*="${id}"]`);
        if (selectEl) {
            selectEl.value = newStatus; 
            const styles = getStatusStyles(newStatus);
            selectEl.style.setProperty('background-color', styles.bg, 'important');
            selectEl.style.setProperty('color', styles.text, 'important');
        }

        const shipBadge = document.getElementById(`ship-badge-${id}`);
        if (shipBadge) {
            if (newStatus === 'Đợi gửi') {
                shipBadge.className = "bg-[#EE6457]/10 text-[#EE6457] border border-[#EE6457]/30 font-black px-3 py-1 rounded-lg text-[11px] shadow-sm whitespace-nowrap transition-all";
            } else {
                shipBadge.className = "bg-slate-100 text-slate-400 border border-slate-200 opacity-60 font-black px-3 py-1 rounded-lg text-[11px] shadow-sm whitespace-nowrap transition-all";
            }
        }
     
        if (typeof renderAnalytics === "function") renderAnalytics();

        // 2. BẬT CỜ VÀ LƯU FIREBASE
        isLocalAction = true;
        userRef.child(`v11_orders/${id}`).update({ status: newStatus })
            .catch(err => {
                showCustomAlert("Lỗi khi lưu trạng thái: " + err.message, "error");
            })
            .finally(() => {
                // Đợi Firebase xử lý xong thì tắt cờ
                setTimeout(() => { isLocalAction = false; }, 500);
            });
    }
}

function togglePaidStatus(id) {
    const orderIndex = orders.findIndex(x => x.id == id);
    if (orderIndex !== -1) {
        const newStatus = !orders[orderIndex].isPaid;
        
        orders[orderIndex].isPaid = newStatus;
        renderTable(); 
        
        if(!document.getElementById('view-analytics').classList.contains('hidden')) {
            renderAnalytics(); 
        }

        userRef.child(`v11_orders/${id}`).update({ isPaid: newStatus })
            .catch(err => {
                orders[orderIndex].isPaid = !newStatus;
                renderTable();
                showCustomAlert("Lỗi hệ thống: " + err.message, "error");
            });
    }
}

function deleteOrder(id) { 
    showCustomConfirm("Bạn có chắc chắn muốn xóa đơn hàng này?", () => {
        userRef.child(`v11_orders/${id}`).remove()
            .then(() => {
                orders = orders.filter(x => x.id != id);
                renderTable();
                showToast("Đã xóa đơn hàng!");
            })
            .catch(error => showCustomAlert("Lỗi khi xóa: " + error.message, "error"));
    });
}

function getStatusStyles(status) {
    const styles = {
        'Đợi gửi': { bg: '#f1f5f9', text: '#000000' },      
        'Đang giao': { bg: '#9ce4ff', text: '#000000' },    
        'Thành công': { bg: '#a4ff9c', text: '#000000' },   
        'Chăm sóc': { bg: '#00ffe5', text: '#000000' },     
        'HD sử dụng': { bg: '#fef3c7', text: '#000000' },   
        'Xử lý': { bg: '#fee2e2', text: '#000000' },        
        'Đơn BOM 💣': { bg: '#fca5a5', text: '#ffffff' },   
        'Đã Hủy': { bg: '#f3f4f6', text: '#374151' }        
    };
    return styles[status] || { bg: '#ffffff', text: '#000000' };
}

function renderAnalytics() {
    const startInput = document.getElementById('filterStart');
    const endInput = document.getElementById('filterEnd');
    
    if (!startInput.value || !endInput.value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        firstDay.setMinutes(firstDay.getMinutes() - firstDay.getTimezoneOffset());
        
        if (!startInput.value) startInput.value = firstDay.toISOString().split('T')[0];
        if (!endInput.value) endInput.value = today.toISOString().split('T')[0];
    }

    const start = startInput.value;
    const end = endInput.value;
    
    let validOrders = orders.filter(o => {
        const targetDate = o.orderDate || o.date;
        return o.status !== "Đã Hủy" && o.status !== "Đơn BOM 💣" && (!start || targetDate >= start) && (!end || targetDate <= end)
    });
    let bomOrders = orders.filter(o => {
        const targetDate = o.orderDate || o.date;
        return o.status === "Đơn BOM 💣" && (!start || targetDate >= start) && (!end || targetDate <= end)
    });

    let sOut = 0, sVnl = 0, sNew = 0, sTtd = 0, grandTotal = 0;
    let sCollected = 0; 
    let dailyRevenue = {}; 

    validOrders.forEach(o => {
        const net = o.total - o.shipFee; 
        grandTotal += net;               
        
        if(o.isPaid) {
            sCollected += net;
        }
        const targetDate = o.orderDate || o.date;
        if(dailyRevenue[targetDate]) dailyRevenue[targetDate] += net; else dailyRevenue[targetDate] = net;
        o.products.forEach(p => {
            const ratio = o.subtotal > 0 ? (p.price * p.qty / o.subtotal) : 0;
            if(OUT_KEYWORDS.some(k => p.name.toUpperCase().includes(k))) sOut += ratio * net; else sVnl += ratio * net;
        });
        if(o.customer.type === 'ttd') sTtd += net; else sNew += net;
    });
    
    let bomTotalValue = bomOrders.reduce((sum, o) => sum + o.total, 0);

    let sAccumulated = 0;
    cvAccumulations.forEach(acc => {
        if (acc.date && (!start || acc.date >= start) && (!end || acc.date <= end)) {
            sAccumulated += acc.amount;
        }
    });

    let sIncome = sCollected - sAccumulated;

    document.getElementById('statOut').innerText = formatMoney(sOut); 
    document.getElementById('statVnl').innerText = formatMoney(sVnl);
    document.getElementById('statNew').innerText = formatMoney(sNew); 
    document.getElementById('statTtd').innerText = formatMoney(sTtd);
    document.getElementById('totalPeriodRevenue').innerText = formatMoney(grandTotal); 
    document.getElementById('statTotalOrders').innerText = validOrders.length;
    document.getElementById('statAvgOrder').innerText = validOrders.length ? formatMoney(grandTotal/validOrders.length) : '0 ₫';
    document.getElementById('statBomCount').innerText = bomOrders.length; 
    document.getElementById('statBomTotal').innerText = formatMoney(bomTotalValue);
    
    document.getElementById('statCollected').innerText = formatMoney(sCollected);
    document.getElementById('statIncome').innerText = formatMoney(sIncome);

    drawRevenueChart(dailyRevenue);
}

function drawRevenueChart(dataObj) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const sortedDates = Object.keys(dataObj).sort();
    const labels = sortedDates.length > 7 ? sortedDates.slice(-7) : sortedDates;
    const dataValues = labels.map(date => dataObj[date]);
    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels.map(d => d.split('-').reverse().join('/')), datasets: [{ label: 'Doanh thu', data: dataValues, backgroundColor: '#034C5F', borderRadius: 4, barThickness: 20 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } } });
}

function showToast(msg) { const t = document.getElementById("toast"); t.innerText = msg; t.className = "show"; setTimeout(() => { t.className = t.className.replace("show", ""); }, 3000); }
function copyCustomerInfo(n, p, a) { navigator.clipboard.writeText(`${n}\n${p}\n${a}`).then(() => showToast("Đã copy info!")); }
function saveCRM() { userRef.child('v11_customers').set(customers); }
function autoFillByPhone() { const p = document.getElementById('custPhone').value; if(customers[p]) { document.getElementById('custName').value = customers[p].name; document.getElementById('custAddr').value = customers[p].address; } }
function autoFillByName() { const n = document.getElementById('custName').value; const p = Object.keys(customers).find(k => customers[k].name === n); if(p) { document.getElementById('custPhone').value = p; document.getElementById('custAddr').value = customers[p].address; } }

function autoSetDeliveryDate() { const d = document.getElementById('shipDate').value; if(d) { const date = new Date(d); date.setDate(date.getDate()+3); document.getElementById('deliveryDate').value = date.toISOString().split('T')[0]; } }

function switchTab(t) {
    ['view-orders', 'view-analytics', 'view-customers', 'view-inventory', 'view-cv'].forEach(v => document.getElementById(v).classList.add('hidden'));
    document.getElementById(`view-${t}`).classList.remove('hidden');
    document.querySelectorAll('nav button').forEach(btn => btn.className = "px-3 md:px-4 py-2 rounded-xl text-sm font-medium text-[#034C5F] transition-all bg-transparent");
    document.getElementById(`tab-${t}`).className = "px-3 md:px-4 py-2 rounded-xl text-sm font-bold bg-white text-[#034C5F] shadow-sm";
    if(t === 'analytics') renderAnalytics();
    if(t === 'inventory') renderInventory();
    if(t === 'customers') renderCustomerCRM();
    if(t === 'cv') { initCVSummaryFilters(); renderAllCV(); }
}

function renderCustomerCRM() {
    const tbody = document.getElementById('customerTableBody');
    if(!tbody) return;
    
    const spendings = {}; 
    orders.forEach(o => {
        if(o && o.customer && o.customer.phone) {
            spendings[o.customer.phone] = (spendings[o.customer.phone] || 0) + o.total;
        }
    });

    const CUSTOMER_STATUS_STYLES = { "Vip": "background-color: #fee2e2; color: #dc2626; font-weight: bold; border: 1px solid #f87171;", "Vãn lai": "background-color: #fef9c3; color: #a16207; font-weight: bold; border: 1px solid #facc15;", "Thân Thiết": "background-color: #dcfce7; color: #15803d; font-weight: bold; border: 1px solid #4ade80;", "Đơn 1": "background-color: #dbeafe; color: #1d4ed8; font-weight: bold; border: 1px solid #60a5fa;", "Đơn 2": "background-color: #f3e8ff; color: #7e22ce; font-weight: bold; border: 1px solid #c084fc;", "Đơn 3": "background-color: #fce7f3; color: #be185d; font-weight: bold; border: 1px solid #f472b6;", "Bom": "background-color: #f3f4f6; color: #4b5563; font-weight: bold; border: 1px solid #9ca3af;", "Ngừng kết nối": "background-color: #ffedd5; color: #c2410c; font-weight: bold; border: 1px solid #fb923c;", "Chăm sóc": "background-color: #ecfdf5; color: #047857; font-weight: normal;" };
    const sortMode = document.getElementById('customerSortOrder').value; 
    
    let keys = Object.keys(customers);

    const searchInput = document.getElementById('searchCustomerInput');
    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase().trim();
        keys = keys.filter(phone => {
            const c = customers[phone];
            return phone.includes(query) || (c && c.name && c.name.toLowerCase().includes(query));
        });
    }

    keys.sort((a, b) => {
        const cA = customers[a] || {};
        const cB = customers[b] || {};
        const nameA = cA.name || "";
        const nameB = cB.name || "";

        if (sortMode === 'newest') return (cB.timestamp || 0) - (cA.timestamp || 0);
        else if (sortMode === 'oldest') return (cA.timestamp || 0) - (cB.timestamp || 0);
        else if (sortMode === 'name') return nameA.localeCompare(nameB);
        else if (sortMode === 'spending') return (spendings[b] || 0) - (spendings[a] || 0); 
        return 0;
    });
    
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDate = String(today.getDate()).padStart(2, '0');
    const todayMMDD = `${todayMonth}-${todayDate}`;

    tbody.innerHTML = keys.map((phone, index) => {
        const c = customers[phone]; if(!c) return ""; 
        const currentStatus = c.status || 'Vãn lai'; 
        const statusStyle = CUSTOMER_STATUS_STYLES[currentStatus] || "";
        
        let bdayMMDD = c.birthday ? c.birthday.substring(5) : "";
        let isBdayToday = (bdayMMDD === todayMMDD);
        let bdayClass = isBdayToday ? "birthday-today" : "bg-light-pink";

        let anniMMDD = c.anniversary ? c.anniversary.substring(5) : "";
        let isAnniToday = (anniMMDD === todayMMDD);
        let anniClass = isAnniToday ? "anniversary-today" : "bg-light-blue";
        
        const safePhone = phone.replace(/'/g, "\\'");
        
        return `<tr>
            <td class="p-3 text-center font-bold text-slate-400">${index + 1}</td>
            <td class="p-3"><textarea rows="1" onchange="updateCustomerField('${safePhone}', 'name', this.value)" class="crm-textarea font-bold text-[#034C5F]">${c.name || ''}</textarea></td>
            <td class="p-3">${phone}</td>
            <td class="p-3"><textarea rows="1" onchange="updateCustomerField('${safePhone}', 'address', this.value)" class="crm-textarea">${c.address||''}</textarea></td>
            <td class="p-3"><input type="text" value="${c.birthday||''}" onchange="updateCustomerField('${safePhone}', 'birthday', this.value)" class="crm-input cursor-pointer flatpickr-date ${bdayClass}" placeholder="DD/MM/YYYY"></td>
            <td class="p-3"><input type="text" value="${c.anniversary||''}" onchange="updateCustomerField('${safePhone}', 'anniversary', this.value)" class="crm-input cursor-pointer flatpickr-date text-[#EE6457] ${anniClass}" placeholder="DD/MM/YYYY"></td>
            <td class="p-3"><textarea rows="1" onchange="updateCustomerField('${safePhone}', 'job', this.value)" class="crm-textarea">${c.job||''}</textarea></td>
            <td class="p-3"><select onchange="updateCustomerField('${safePhone}', 'status', this.value); renderCustomerCRM();" class="crm-input rounded-md px-2 py-1 transition-all" style="${statusStyle}"><option value="Vip" ${currentStatus === 'Vip' ? 'selected' : ''}>Vip 🍀</option><option value="Vãn lai" ${currentStatus === 'Vãn lai' ? 'selected' : ''}>Vãn lai 🍃</option><option value="Thân Thiết" ${currentStatus === 'Thân Thiết' ? 'selected' : ''}>Thân thiết 🌺</option><option value="Đơn 1" ${currentStatus === 'Đơn 1' ? 'selected' : ''}> Đơn 1 💙</option><option value="Đơn 2" ${currentStatus === 'Đơn 2' ? 'selected' : ''}> Đơn 2 💜</option><option value="Đơn 3" ${currentStatus === 'Đơn 3' ? 'selected' : ''}> Đơn 3 🩷</option><option value="Bom" ${currentStatus === 'Bom' ? 'selected' : ''}>Bom 💣</option><option value="Ngừng kết nối" ${currentStatus === 'Ngừng kết nối' ? 'selected' : ''}>Ngừng kết nối ❌</option><option value="Chăm sóc" ${currentStatus === 'Chăm sóc' ? 'selected' : ''}>Chăm sóc</option></select></td>
            <td class="p-3"><textarea rows="1" onchange="updateCustomerField('${safePhone}', 'note', this.value)" class="crm-textarea italic text-slate-600">${c.note||''}</textarea></td>
            <td class="p-3 text-right font-black text-[#034C5F]">${formatMoney(spendings[phone]||0)}</td>
            <td class="p-3 text-center"><button onclick="deleteCustomer('${safePhone}')" class="text-slate-300 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    }).join('');
 
    if (typeof flatpickr !== "undefined") {
        requestAnimationFrame(() => {
            if (window.datePickerInstances) {
                window.datePickerInstances.forEach(instance => {
                    if(instance && typeof instance.destroy === 'function') instance.destroy();
                });
            }
            window.datePickerInstances = flatpickr(".flatpickr-date", {
                dateFormat: "Y-m-d",
                altInput: true,
                disableMobile: true 
            });
        });
    }


    if (typeof flatpickr !== "undefined") {
        requestAnimationFrame(() => {
            if (window.datePickerInstances) {
                window.datePickerInstances.forEach(instance => {
                    if(instance && typeof instance.destroy === 'function') instance.destroy();
                });
            }
            window.datePickerInstances = flatpickr(".flatpickr-date", {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y", // Thêm dòng này để hiển thị dd/mm/yyyy
                locale: "vn",       // Thêm dòng này để áp dụng tiếng Việt
                disableMobile: true 
            });
        });
    }
}



function updateCustomerField(p, f, v) { if(customers[p]) { customers[p][f] = v; saveCRM(); } }

function deleteCustomer(p) { 
    showCustomConfirm("Bạn có chắc chắn muốn xóa khách hàng này khỏi danh sách?", () => {
        delete customers[p]; 
        saveCRM(); 
        showToast("Đã xóa khách hàng!");
    }); 
}

function resetForm() { document.getElementById('orderForm').reset(); document.getElementById('editOrderId').value = ""; document.getElementById('product-list').innerHTML = ""; addProductRow(); document.getElementById('orderDate').valueAsDate = new Date(); document.getElementById('shipDate').valueAsDate = new Date(); autoSetDeliveryDate(); calculateTotal(); document.getElementById('btnSave').innerHTML = '<i class="fa-solid fa-check-double mr-2"></i>Lưu đơn'; }
function closeModal() { document.getElementById('invoiceModal').classList.add('hidden'); }

function downloadImage() {
    const invoice = document.getElementById('invoiceContent');
    const modal = document.getElementById('invoiceModal');
    
    const btn = document.querySelector('button[onclick="downloadImage()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>ĐANG XỬ LÝ...';
    btn.disabled = true;

    const originalOverflow = invoice.style.overflow;
    const originalPadding = invoice.style.paddingBottom;
    const originalShadow = invoice.style.boxShadow;

    invoice.style.overflow = 'visible';
    invoice.style.paddingBottom = "30px";
    invoice.style.boxShadow = 'none'; 

    modal.scrollTop = 0;
    window.scrollTo(0, 0);

    setTimeout(() => {
        html2canvas(invoice, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            scrollY: -window.scrollY, 
            windowWidth: invoice.scrollWidth,
            windowHeight: invoice.scrollHeight
        }).then(canvas => {
            const link = document.createElement('a');
            const timeStr = new Date().getTime(); 
            link.download = `HoaDon_BNDShop_${timeStr}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

            showToast("✅ Đã lưu ảnh hóa đơn thành công!");
        }).catch(err => {
            console.error("Lỗi xuất ảnh:", err);
            showToast("❌ Có lỗi xảy ra khi lưu ảnh, vui lòng thử lại!");
        }).finally(() => {
            invoice.style.overflow = originalOverflow || '';
            invoice.style.paddingBottom = originalPadding || '';
            invoice.style.boxShadow = originalShadow || '';
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }, 300); 
}

function editOrder(id) { 
    const o = orders.find(x => x.id == id); 
    if(!o) return;
    document.getElementById('editOrderId').value = o.id; 
    document.getElementById('custPhone').value = o.customer.phone; 
    document.getElementById('custName').value = o.customer.name; 
    document.getElementById('custAddr').value = o.customer.addr; 
    document.getElementById('custType').value = o.customer.type || 'new'; 
    document.getElementById('product-list').innerHTML = ""; 
    o.products.forEach(p => addProductRow(p.name, p.price, p.qty)); 
    document.getElementById('payMethod').value = o.payMethod; 
    document.getElementById('shipFee').value = o.shipFee; 
    document.getElementById('discountVal').value = o.discount.val; 
    document.getElementById('discountType').value = o.discount.type; 
    document.getElementById('orderDate').value = o.orderDate || o.date; 
    document.getElementById('shipDate').value = o.date; 
    document.getElementById('deliveryDate').value = o.deliveryDate; 
    document.getElementById('orderNote').value = o.note || ''; 
    document.getElementById('btnSave').innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>Cập nhật'; 
    calculateTotal(); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function openInvoice(id) { 
    const o = orders.find(x => x.id == id); 
    
    if (!o) {
        showToast("Không tìm thấy dữ liệu đơn hàng!");
        return;
    }
    
    const noteHtml = o.note ? `
        <div style="padding:15px; background:#FDF5F4; border-radius:12px; font-size:12px; color:#034C5F; margin:15px 0; border:1px solid #F9C4BA; line-height: 1.5; text-align: left;">
            <b style="color:#EE6457;">Ghi chú:</b> <span style="display:inline-block; padding-bottom:2px;">${o.note}</span>
        </div>` : '<div style="margin-top:20px"></div>'; 
        
    document.getElementById('invoiceContent').innerHTML = ` 
        <div style="padding:40px 30px; text-align:center; background:white;">
            <h1 style="margin:0; font-size:32px; font-weight:900; color:#034C5F; letter-spacing:1px; line-height: 1.2;">HÓA ĐƠN</h1>
            <p style="margin:8px 0 0 0; color:#EE6457; font-size:14px; font-weight:600; line-height: 1.5;">🌷 Mọi sản phẩm gửi đi là cả tấm lòng 🌷</p> 
        </div> 
        <div style="padding:0 20px 10px 20px; background:white;"> 
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:15px; margin-bottom:10px;"> 
                <div style="text-align: left;">
                    <p style="font-weight:800; font-size:16px; margin:0; color:#034C5F; line-height: 2.0; padding-bottom: 2px;">${o.customer.name}</p> 
                    <p style="color:#44; font-size:13px; margin:3px 0; line-height: 1.4;">${o.customer.phone}</p> 
                    <p style="color:#44; font-size:11px; margin:0; max-width:200px; line-height: 1.5;">${o.customer.addr}</p> 
                </div> 
                <div style="text-align:right; font-size:11px; color:#64748b; line-height: 2.3;"> 
                    <p style="margin:0;">Ngày đặt: <b style="display:inline-block; padding-bottom:1px;">${(o.orderDate || o.date).split('-').reverse().join('/')}</b></p> 
                    <p style="margin:0;">Ngày gửi: <b style="display:inline-block; padding-bottom:1px;">${o.date.split('-').reverse().join('/')}</b></p> 
                    <p style="margin:0;">Dự Kiến Nhận: <b style="display:inline-block; padding-bottom:1px;">${o.deliveryDate.split('-').reverse().join('/')}</b></p> 
                    <p style="color:#EE6457; font-weight:800; margin-top:5px; text-transform:uppercase; line-height: 1.8;">${o.payMethod}</p> 
                </div> 
            </div> 
            
            <table style="width:100%; border-collapse:collapse; font-size:13px; line-height: 2.0;"> 
                ${o.products.map(p => `<tr><td style="padding:10px 0; border-bottom:1px solid #f8fafc; text-align: left;">${p.name} (x${p.qty})</td><td style="text-align:right; font-weight:700; color:#034C5F;">${formatMoney(p.price*p.qty)}</td></tr>`).join('')} 
            </table> 
            
            ${noteHtml} 
            
            <div style="border-top:2px solid #034C5F; padding-top:15px; margin-bottom:20px;"> 
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:4px; line-height: 1.5;">
                    <span>Vận chuyển:</span><span>+ ${formatMoney(o.shipFee)}</span>
                </div> 
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#EE6457; margin-bottom:10px; line-height: 1.5;">
                    <span>Giảm giá:</span><span>- ${o.discount.val}${o.discount.type==='percent'?'%':'₫'}</span>
                </div> 
                <div style="display:flex; justify-content:space-between; font-weight:900; font-size:28px; color:#034C5F; line-height: 1.2; align-items: center;">
                    <span style="font-size: 16px;">TỔNG THU:</span><span style="padding-bottom: 4px;">${formatMoney(o.total)}</span>
                </div> 
            </div> 
            
            <div style="text-align:center; padding-top:15px; border-top:1px dashed #F9C4BA;"> 
                <p style="font-size:14px; font-weight:700; color:#034C5F; margin:0; line-height: 1.5;">Cảm ơn bạn đã ủng hộ Shop! ❤️</p> 
                <p style="font-size:10px; color:#97BEC6; margin-top:4px; line-height: 1.5; padding-bottom: 10px;">🍀Chúc quý khách có những trải nghiệm tuyệt vời với sản phẩm🍀</p> 
            </div> 
        </div>`; 
        
    document.getElementById('invoiceModal').classList.remove('hidden'); 
}           

function openExportModal() { document.getElementById('exportModal').classList.remove('hidden'); const today = new Date(); document.getElementById('exportStartDate').value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]; document.getElementById('exportEndDate').value = today.toISOString().split('T')[0]; document.getElementById('exportFileName').value = `Don_Hang_Thang_${today.getMonth()+1}`; }
function closeExportModal() { document.getElementById('exportModal').classList.add('hidden'); }
function confirmExport() { const fileName = document.getElementById('exportFileName').value.trim() || `Export_${Date.now()}`; const s = document.getElementById('exportStartDate').value; const e = document.getElementById('exportEndDate').value; const data = orders.filter(o => { const targetDate = o.orderDate || o.date; return (!s || targetDate >= s) && (!e || targetDate <= e) }); let csv = "\ufeffMã Đơn,Ngày Đặt,Ngày Gửi,Ngày Giao,Tên,SĐT,Sản Phẩm,Tổng Tiền\n"; data.forEach(o => csv += `${o.id},${o.orderDate || o.date},${o.date},"${o.customer.name}","${o.customer.phone}","${o.products.map(p=>p.name).join('|')}",${o.total}\n`); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = `${fileName}.csv`; link.click(); closeExportModal(); }

function exportCustomersToExcel() { let csv = "\ufeffTên,SĐT,Địa Chỉ,Sinh Nhật,Ngày Kỉ Niệm,Công Việc,Tình Trạng,Ghi Chú,Tổng Chi\n"; Object.keys(customers).forEach(p => { const c = customers[p]; const totalSpend = orders.filter(o=>o.customer.phone==p).reduce((a,b)=>a+b.total,0); csv += `"${c.name}","${p}","${c.address || ''}","${c.birthday || ''}","${c.anniversary || ''}","${c.job || ''}","${c.status || ''}","${c.note || ''}","${totalSpend}"\n`; }); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = "KhachHang.csv"; link.click(); }

function resetOrderFilters() { document.getElementById('listFilterStart').value = ''; document.getElementById('listFilterEnd').value = ''; document.getElementById('listFilterType').value = 'all'; renderTable(); }

function saveCVSync() {
    userRef.update({
        'v11_cv_accumulations': cvAccumulations,
        'v11_cv_monthly': cvMonthlyStats
    });
}

function renderAllCV() {
    renderCVAccumulations();
    renderCVMonthlyStats();
    renderCVSummary();
}

function addCVAccumulation() {
    let amtInput = document.getElementById('cvAccAmount').value;
    let amount = parseCurrency(amtInput);
    let date = document.getElementById('cvAccDate').value;
    let method = document.getElementById('cvAccMethod').value;
    let note = document.getElementById('cvAccNote').value;
    let editId = document.getElementById('editCvAccId').value;

    if (!amount || !date) return showToast("Vui lòng nhập số tiền và ngày tích!");

    if(editId) {
        let idx = cvAccumulations.findIndex(a => a.id == editId);
        if(idx !== -1) {
            cvAccumulations[idx].amount = amount;
            cvAccumulations[idx].date = date;
            cvAccumulations[idx].method = method;
            cvAccumulations[idx].note = note;
        }
        document.getElementById('editCvAccId').value = "";
        document.getElementById('btnSaveCVAcc').innerText = "THÊM MỚI"; 
    } else {
        cvAccumulations.push({
            id: Date.now(),
            amount: amount,
            date: date,
            method: method,
            checked: false,
            note: note
        });
    }

    document.getElementById('cvAccAmount').value = '';
    document.getElementById('cvAccDate').value = '';
    document.getElementById('cvAccNote').value = '';

    cvAccumulations.sort((a,b) => new Date(b.date) - new Date(a.date));

    saveCVSync();
    renderAllCV(); 
    showToast("Đã lưu tích lũy thành công!");
}

function editCVAccumulation(id) {
    let acc = cvAccumulations.find(a => a.id === id);
    if(!acc) return;
    document.getElementById('editCvAccId').value = acc.id;
    document.getElementById('cvAccAmount').value = new Intl.NumberFormat('en-US').format(acc.amount);
    document.getElementById('cvAccDate').value = acc.date;
    document.getElementById('cvAccMethod').value = acc.method;
    document.getElementById('cvAccNote').value = acc.note || '';
    document.getElementById('btnSaveCVAcc').innerText = "CẬP NHẬT";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleCVCheck(id) {
    let acc = cvAccumulations.find(a => a.id === id);
    if(acc) {
        acc.checked = !acc.checked;
        saveCVSync();
        renderCVAccumulations();
    }
}

function deleteCVAccumulation(id) {
    showCustomConfirm("Bạn có chắc chắn muốn xóa dòng tích lũy này?", () => {
        cvAccumulations = cvAccumulations.filter(a => a.id !== id);
        saveCVSync();
        renderAllCV();
        showToast("Đã xóa tích lũy!");
    });
}

function renderCVAccumulations() {
    const tbody = document.getElementById('cvAccTableBody');
    const filterMonth = document.getElementById('cvAccFilterMonth').value;
    
    let filtered = cvAccumulations;
    if (filterMonth) {
        filtered = cvAccumulations.filter(acc => acc.date && acc.date.startsWith(filterMonth));
    }

    tbody.innerHTML = filtered.map((acc) => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-bold text-[#034C5F]">${acc.date.split('-').reverse().join('/')}</td>
            <td class="p-4 text-right font-black text-[#EE6457] text-[16px]">${new Intl.NumberFormat('en-US').format(acc.amount)} đ</td>
            <td class="p-4 text-center"><span class="px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">${acc.method}</span></td>
            <td class="p-4 text-xs italic text-slate-500">${acc.note || ''}</td>
            <td class="p-4 text-center">
                <input type="checkbox" ${acc.checked ? 'checked' : ''} onchange="toggleCVCheck(${acc.id})" class="w-5 h-5 accent-[#034C5F] cursor-pointer">
            </td>
            <td class="p-4 text-center">
                <div class="flex justify-center gap-3">
                    <button onclick="editCVAccumulation(${acc.id})" class="text-[#97BEC6] hover:text-[#034C5F]" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square text-lg"></i></button>
                    <button onclick="deleteCVAccumulation(${acc.id})" class="text-slate-300 hover:text-red-500" title="Xóa"><i class="fa-solid fa-trash text-lg"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getSumAccumulationForMonth(yyyy_mm) {
    return cvAccumulations.reduce((sum, acc) => {
        if (acc.date && acc.date.startsWith(yyyy_mm)) return sum + acc.amount;
        return sum;
    }, 0);
}

function saveCVMonthlyStat() {
    let monthPick = document.getElementById('cvMonthPick').value;
    let cv = parseCurrency(document.getElementById('cvMonthCV').value);
    let importAmt = parseCurrency(document.getElementById('cvMonthImport').value);
    let manualNote = document.getElementById('cvMonthNote').value.trim();
    let entryType = document.getElementById('cvMonthEntry').value;

    if(!monthPick) return showToast("Vui lòng chọn Tháng để lưu!");

    let finalNote = "";
    if (entryType === "Ghi đè") {
        finalNote = manualNote; 
    } else {
        finalNote = manualNote ? `${entryType} (${manualNote})` : entryType;
    }

    if (entryType === "Ghi đè") {
        cvMonthlyStats[monthPick] = {
            cv: cv,
            importAmt: importAmt,
            note: finalNote
        };
        showToast("Đã ghi đè lại toàn bộ số liệu tháng!");
    } else {
        if (cvMonthlyStats[monthPick]) {
            cvMonthlyStats[monthPick].cv = (cvMonthlyStats[monthPick].cv || 0) + cv;
            cvMonthlyStats[monthPick].importAmt = (cvMonthlyStats[monthPick].importAmt || 0) + importAmt;
            
            let oldNote = cvMonthlyStats[monthPick].note || "";
            cvMonthlyStats[monthPick].note = oldNote ? (oldNote + " | " + finalNote) : finalNote;
        } else {
            cvMonthlyStats[monthPick] = {
                cv: cv,
                importAmt: importAmt,
                note: finalNote
            };
        }
        showToast(`Đã cộng gộp thành công (${entryType})!`);
    }

    document.getElementById('cvMonthCV').value = '';
    document.getElementById('cvMonthImport').value = '';
    document.getElementById('cvMonthNote').value = '';
    document.getElementById('cvMonthEntry').value = 'Lần 1'; 
    
    document.getElementById('btnSaveCVMonth').innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> LƯU'; 
    document.getElementById('btnSaveCVMonth').classList.replace('bg-amber-500', 'bg-[#EE6457]');

    saveCVSync();
    renderAllCV();
}

function editCVMonthlyStat(monthKey) {
    let stat = cvMonthlyStats[monthKey];
    if(!stat) return;
    
    document.getElementById('cvMonthPick').value = monthKey;
    document.getElementById('cvMonthCV').value = new Intl.NumberFormat('en-US').format(stat.cv || 0);
    document.getElementById('cvMonthImport').value = new Intl.NumberFormat('en-US').format(stat.importAmt || 0);
    document.getElementById('cvMonthNote').value = stat.note || '';
    
    document.getElementById('cvMonthEntry').value = 'Ghi đè';
    let btnSave = document.getElementById('btnSaveCVMonth');
    btnSave.innerHTML = '<i class="fa-solid fa-pen mr-1"></i> GHI ĐÈ';
    btnSave.classList.replace('bg-[#EE6457]', 'bg-amber-500'); 
    
    document.getElementById('cvMonthPick').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteCVMonthlyStat(monthKey) {
    showCustomConfirm(`Bạn có chắc chắn muốn xóa thống kê của tháng ${monthKey}?`, () => {
        delete cvMonthlyStats[monthKey];
        saveCVSync();
        renderAllCV();
        showToast("Đã xóa thống kê tháng!");
    });
}

function initCVSummaryFilters() {
    let yearSelect = document.getElementById('cvSumYear');
    let tableYearSelect = document.getElementById('cvMonthTableFilterYear'); 
    let currentYear = new Date().getFullYear();
    let yearsHtml = `<option value="all">Tất cả các năm</option>`;
    
    for(let y = currentYear - 6; y <= currentYear + 2; y++) {
        yearsHtml += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>Năm ${y}</option>`;
    }
    
    if(yearSelect) yearSelect.innerHTML = yearsHtml;
    if(tableYearSelect) tableYearSelect.innerHTML = yearsHtml; 
}

function renderCVMonthlyStats() {
    const tbody = document.getElementById('cvMonthTableBody');
    if(!tbody) return;
    
    const filterYearElement = document.getElementById('cvMonthTableFilterYear');
    const filterYear = filterYearElement ? filterYearElement.value : 'all';
    
    let allMonths = new Set(Object.keys(cvMonthlyStats));
    cvAccumulations.forEach(acc => {
        if(acc.date) allMonths.add(acc.date.substring(0,7));
    });

    let sortedMonths = Array.from(allMonths).sort((a,b) => b.localeCompare(a));

    if(filterYear !== 'all') {
        sortedMonths = sortedMonths.filter(month => month.startsWith(filterYear));
    }

    tbody.innerHTML = sortedMonths.map(month => {
        let stat = cvMonthlyStats[month] || { cv: 0, importAmt: 0, note: '' };
        let totalAcc = getSumAccumulationForMonth(month);
        let remaining = totalAcc - stat.importAmt;
        
        let noteHtml = stat.note ? `<div class="text-[10px] text-slate-500 italic mt-1 bg-slate-50 p-1 rounded"><i class="fa-solid fa-quote-left mr-1 opacity-50"></i>${stat.note}</div>` : '';
        
        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 text-center border-r border-slate-100">
                <div class="font-black text-[#034C5F] bg-blue-50 py-1 rounded-md border border-blue-100">${month}</div>
            </td>
            <td class="p-3 text-right font-black text-emerald-600">${new Intl.NumberFormat('en-US').format(totalAcc)} đ</td>
            <td class="p-3 text-right font-bold text-slate-700">${new Intl.NumberFormat('en-US').format(stat.cv)} Cv</td>
            <td class="p-3 text-right font-black text-rose-500">${new Intl.NumberFormat('en-US').format(stat.importAmt)} đ</td>
            <td class="p-3 text-right font-black ${remaining >= 0 ? 'text-amber-500' : 'text-red-600'}">${new Intl.NumberFormat('en-US').format(remaining)} đ</td>
            <td class="p-3 align-top">
                <div class="flex justify-center gap-2 items-center h-full">
                    ${cvMonthlyStats[month] ? `
                        <button onclick="editCVMonthlyStat('${month}')" class="text-blue-400 hover:text-blue-600 bg-white shadow-sm rounded p-1.5 border border-slate-200" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteCVMonthlyStat('${month}')" class="text-red-400 hover:text-red-600 bg-white shadow-sm rounded p-1.5 border border-slate-200" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    ` : '<span class="text-[10px] text-slate-400 italic">Chưa chốt</span>'}
                </div>
                ${noteHtml}
            </td>
        </tr>
        `;
    }).join('');
            
    if(sortedMonths.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 font-bold italic">Không có dữ liệu trong năm ${filterYear}</td></tr>`;
    }
}

function renderCVSummary() {
    let mFilter = document.getElementById('cvSumMonth').value;
    let yFilter = document.getElementById('cvSumYear').value;
    
    let totalCV = 0;
    let totalAcc = 0;
    let totalImport = 0;

    cvAccumulations.forEach(acc => {
        if(!acc.date) return;
        let [y, m, d] = acc.date.split('-');
        if( (yFilter === 'all' || y === yFilter) && (mFilter === 'all' || m === mFilter) ) {
            totalAcc += acc.amount;
        }
    });

    for (let monthKey in cvMonthlyStats) {
        let [y, m] = monthKey.split('-');
        if( (yFilter === 'all' || y === yFilter) && (mFilter === 'all' || m === mFilter) ) {
            totalCV += cvMonthlyStats[monthKey].cv || 0;
            totalImport += cvMonthlyStats[monthKey].importAmt || 0;
        }
    }

    let remain = totalAcc - totalImport;

    document.getElementById('sumCV').innerText = new Intl.NumberFormat('en-US').format(totalCV) + ' Cv';
    document.getElementById('sumAcc').innerText = formatMoney(totalAcc);
    document.getElementById('sumImport').innerText = formatMoney(totalImport);
    document.getElementById('sumRemain').innerText = formatMoney(remain);
}

function exportCVToExcel() {
    let csv = "\ufeffTháng,Tổng tiền tích (Tự động),CV,Tổng tiền nhập,Còn Lại Chưa Nâng,Ghi chú\n";
    
    let allMonths = new Set(Object.keys(cvMonthlyStats));
    cvAccumulations.forEach(acc => {
        if(acc.date) allMonths.add(acc.date.substring(0,7));
    });
    let sortedMonths = Array.from(allMonths).sort((a,b) => b.localeCompare(a));

    sortedMonths.forEach(month => {
        let stat = cvMonthlyStats[month] || { cv: 0, importAmt: 0, note: '' };
        let totalAcc = getSumAccumulationForMonth(month);
        let remaining = totalAcc - stat.importAmt;
        
        let note = stat.note ? stat.note.replace(/"/g, '""') : '';
        
        csv += `"${month}","${totalAcc}","${stat.cv}","${stat.importAmt}","${remaining}","${note}"\n`;
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Thong_Ke_CV_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    showToast("Đã xuất file Excel thống kê CV!");
}

document.addEventListener('DOMContentLoaded', () => {
    const orderDateEl = document.getElementById('orderDate');
    const shipDateEl = document.getElementById('shipDate');
    const cvAccDateEl = document.getElementById('cvAccDate');
    const cvMonthPickEl = document.getElementById('cvMonthPick');

    if (orderDateEl) orderDateEl.valueAsDate = new Date();
    if (shipDateEl) shipDateEl.valueAsDate = new Date(); 
    if (cvAccDateEl) cvAccDateEl.valueAsDate = new Date();
    
    let d = new Date();
    let currentMonthStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
    if (cvMonthPickEl) cvMonthPickEl.value = currentMonthStr;

    const listFilterStart = document.getElementById('listFilterStart');
    const listFilterEnd = document.getElementById('listFilterEnd');

    if (listFilterStart && listFilterEnd) {
        const todayLocal = new Date();
        const firstDayLocal = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 1);
        
        firstDayLocal.setMinutes(firstDayLocal.getMinutes() - firstDayLocal.getTimezoneOffset());
        todayLocal.setMinutes(todayLocal.getMinutes() - todayLocal.getTimezoneOffset());
        
        listFilterStart.value = firstDayLocal.toISOString().split('T')[0];
        listFilterEnd.value = todayLocal.toISOString().split('T')[0];
    }

    if (typeof autoSetDeliveryDate === 'function') autoSetDeliveryDate(); 
    
    setupCustomAutocomplete();

    const productList = document.getElementById('product-list');
    if (productList && productList.children.length === 0) {
        addProductRow();
    }
});


function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    menu.classList.toggle('hidden');
    
    document.getElementById('notificationMenu').classList.add('hidden');
    
    const closeMenu = (e) => {
        if (!document.getElementById('settingsMenuContainer').contains(e.target)) {
            menu.classList.add('hidden');
            document.removeEventListener('click', closeMenu);
        }
    };
    
    if (!menu.classList.contains('hidden')) {
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    } else {
        document.removeEventListener('click', closeMenu);
    }
}

function openChangePassModal() {
    document.getElementById('settingsMenu').classList.add('hidden');
    document.getElementById('changePassModal').classList.remove('hidden');
}

function closeChangePassModal() {
    document.getElementById('changePassModal').classList.add('hidden');
    document.getElementById('newPassInput').value = '';
}

function saveNewPassword() {
    const newPass = document.getElementById('newPassInput').value.trim();
    const currentEmpId = localStorage.getItem('v11_employee_id'); 

    if (!newPass) {
        showCustomAlert("Vui lòng nhập mật khẩu mới!", "warning");
        return;
    }

    if (currentEmpId) {
        db.ref('SunsetShopData/Employees/' + currentEmpId + '/password').set(newPass)
            .then(() => {
                showCustomAlert("Đã đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.", "success");
                closeChangePassModal();
            })
            .catch((error) => {
                showCustomAlert("Lỗi khi lưu mật khẩu: " + error.message, "error");
            });
    } else {
        showCustomAlert("Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!", "error");
    }
}

function optimizeNativeDatePickers() {
    const currentYear = new Date().getFullYear();
    const minYear = 2018;
    const maxYear = currentYear + 2;

    const accDate = document.getElementById('cvAccDate');
    const monthPick = document.getElementById('cvMonthPick');

    if (accDate) {
        accDate.min = `${minYear}-01-01`;
        accDate.max = `${maxYear}-12-31`;
        
        if (!accDate.value) {
            const today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            accDate.value = today.toISOString().split('T')[0];
        }
    }

    if (monthPick) {
        monthPick.min = `${minYear}-01`;
        monthPick.max = `${maxYear}-12`;

        if (!monthPick.value) {
            const today = new Date();
            let m = today.getMonth() + 1;
            let y = today.getFullYear();
            monthPick.value = `${y}-${m.toString().padStart(2, '0')}`;
        }
    }

    const filterStart = document.getElementById('filterStart');
    const filterEnd = document.getElementById('filterEnd');
    
    if (filterStart && filterEnd) {
        const todayFilter = new Date();
        const firstDayFilter = new Date(todayFilter.getFullYear(), todayFilter.getMonth(), 1);
        
        firstDayFilter.setMinutes(firstDayFilter.getMinutes() - firstDayFilter.getTimezoneOffset());
        todayFilter.setMinutes(todayFilter.getMinutes() - todayFilter.getTimezoneOffset());
        
        if (!filterStart.value) {
            filterStart.value = firstDayFilter.toISOString().split('T')[0];
        }
        if (!filterEnd.value) {
            filterEnd.value = todayFilter.toISOString().split('T')[0];
        }
    }
}

function setupCustomAutocomplete() {
    const phoneInput = document.getElementById('custPhone');
    const phoneBox = document.getElementById('phoneSuggestions');
    const nameInput = document.getElementById('custName');
    const nameBox = document.getElementById('nameSuggestions');

    function renderSuggestions(inputElement, boxElement, type) {
        const val = inputElement.value.toLowerCase().trim();
        boxElement.innerHTML = '';
        
        if (!val) {
            boxElement.classList.remove('active');
            return;
        }

        let matches = [];
        const customerKeys = Object.keys(customers);

        if (type === 'phone') {
            matches = customerKeys.filter(phone => phone.includes(val)).slice(0, 5); 
        } else {
            matches = customerKeys.filter(phone => customers[phone].name.toLowerCase().includes(val)).slice(0, 5);
        }

        if (matches.length > 0) {
            matches.forEach(phone => {
                const c = customers[phone];
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = type === 'phone' 
                    ? `<b>${phone}</b> - <span class="text-xs text-slate-500">${c.name}</span>`
                    : `<b>${c.name}</b> - <span class="text-xs text-slate-500">${phone}</span>`;
                
                div.onclick = () => {
                    document.getElementById('custPhone').value = phone;
                    document.getElementById('custName').value = c.name;
                    document.getElementById('custAddr').value = c.address || '';
                    boxElement.classList.remove('active');
                };
                boxElement.appendChild(div);
            });
            boxElement.classList.add('active');
        } else {
            boxElement.classList.remove('active');
        }
    }

    if (phoneInput && phoneBox) {
        phoneInput.addEventListener('input', () => renderSuggestions(phoneInput, phoneBox, 'phone'));
        phoneInput.addEventListener('focus', () => renderSuggestions(phoneInput, phoneBox, 'phone'));
    }
    if (nameInput && nameBox) {
        nameInput.addEventListener('input', () => renderSuggestions(nameInput, nameBox, 'name'));
        nameInput.addEventListener('focus', () => renderSuggestions(nameInput, nameBox, 'name'));
    }

    document.getElementById('product-list').addEventListener('input', function(e) {
        if (e.target.classList.contains('p-name')) {
            handleProductSearch(e.target);
        }
    });

    document.getElementById('product-list').addEventListener('focusin', function(e) {
        if (e.target.classList.contains('p-name')) {
            handleProductSearch(e.target);
        }
    });

    function handleProductSearch(input) {
        const val = input.value.toLowerCase().trim();
        const box = input.nextElementSibling; 
        box.innerHTML = '';

        if (!val) {
            box.classList.remove('active');
            return;
        }

        const matches = inventory.filter(p => p.name.toLowerCase().includes(val)).slice(0, 5);
        
        if (matches.length > 0) {
            matches.forEach(p => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `<b>${p.name}</b> <br> <span class="text-[10px] text-[#EE6457]">Kho: ${p.qty} | Giá: ${formatMoney(p.price)}</span>`;
                
                div.onclick = () => {
                    input.value = p.name;
                    const row = input.closest('.product-row');
                    row.querySelector('.p-price').value = new Intl.NumberFormat('en-US').format(p.price);
                    calculateTotal();
                    box.classList.remove('active');
                };
                box.appendChild(div);
            });
            box.classList.add('active');
        } else {
            box.classList.remove('active');
        }
    }

    document.addEventListener('click', function(e) {
        if (phoneBox && !phoneBox.contains(e.target) && e.target !== phoneInput) phoneBox.classList.remove('active');
        if (nameBox && !nameBox.contains(e.target) && e.target !== nameInput) nameBox.classList.remove('active');
        
        document.querySelectorAll('.product-suggestions').forEach(box => {
            if (!box.contains(e.target) && e.target !== box.previousElementSibling) {
                box.classList.remove('active');
            }
        });
    });
}

// BỘ LỌC VÀ CHỈNH SỬA SỰ KIỆN ĐƯỢC GIỮ NGUYÊN (KHÔNG ĐỤNG CHẠM)
function checkAndShowEvents() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; 
    const currentYear = today.getFullYear();

    let events = [];

    for (const phone in customers) {
        const c = customers[phone];
        
        if (c.birthday) {
            const [bYear, bMonth, bDay] = c.birthday.split('-');
            if (parseInt(bMonth) === currentMonth) {
                const age = currentYear - parseInt(bYear);
                events.push({
                    type: 'birthday',
                    name: c.name,
                    phone: phone,
                    date: `${bDay}/${bMonth}`,
                    number: age > 0 ? age : 0, 
                    sortDay: parseInt(bDay)
                });
            }
        }

        if (c.anniversary) {
            const [aYear, aMonth, aDay] = c.anniversary.split('-');
            if (parseInt(aMonth) === currentMonth) {
                const years = currentYear - parseInt(aYear);
                if (years >= 1) { 
                    events.push({
                        type: 'anniversary',
                        name: c.name,
                        phone: phone,
                        date: `${aDay}/${aMonth}`,
                        number: years, 
                        sortDay: parseInt(aDay)
                    });
                }
            }
        }
    }

    events.sort((a, b) => a.sortDay - b.sortDay);

    const dot = document.getElementById('notificationDot');
    const countBadge = document.getElementById('notificationCount');
    const listContainer = document.getElementById('notificationList');

    if (events.length > 0) {
        dot.classList.remove('hidden');
        countBadge.innerText = events.length;
        
        let html = '';
        events.forEach(e => {
            if (e.type === 'birthday') {
                html += `
                    <div class="p-2.5 bg-pink-30 rounded-xl border border-pink-100 flex items-center gap-3 hover:bg-pink-100 transition-colors cursor-default">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-pink-100 to-pink-250 text-pink-600 flex items-center justify-center shrink-0 shadow-inner">
                            <i class="fa-solid fa-cake-candles"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-black text-[#034C5F] truncate">${e.name}</p>
                            <p class="text-[10px] text-slate-500 font-semibold mb-0.5">${e.phone}</p>
                            <p class="text-[10px] font-bold text-Slate-500 bg-pink-150 inline-block px-1.5 py-0.5 rounded">
                                Ngày ${e.date} <span class="text-slate-500">(${e.number} tuổi)</span>
                            </p>
                        </div>
                    </div>`;
            } else {
                html += `
                    <div class="p-2.5 bg-blue-30 rounded-xl border border-blue-100 flex items-center gap-3 hover:bg-blue-100 transition-colors cursor-default">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-250 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                            <i class="fa-solid fa-heart"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-black text-[#034C5F] truncate">${e.name}</p>
                            <p class="text-[10px] text-slate-500 font-semibold mb-0.5">${e.phone}</p>
                            <p class="text-[10px] font-bold text-slate-500 bg-blue-150 inline-block px-1.5 py-0.5 rounded">
                                Ngày ${e.date} <span class="text-slate-500">(${e.number} năm)</span>
                            </p>
                        </div>
                    </div>`;
            }
        });
        listContainer.innerHTML = html;
    } else {
        dot.classList.add('hidden');
        countBadge.innerText = '0';
        listContainer.innerHTML = `
            <div class="py-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <i class="fa-regular fa-bell-slash text-xl text-slate-300"></i>
                </div>
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Trống</p>
                <p class="text-[10px] mt-1">Tháng này không có sự kiện.</p>
            </div>`;
    }
}

function toggleNotificationMenu() {
    const menu = document.getElementById('notificationMenu');
    menu.classList.toggle('hidden');
    
    document.getElementById('settingsMenu').classList.add('hidden');
    
    const closeMenu = (e) => {
        if (!document.getElementById('notificationMenuContainer').contains(e.target)) {
            menu.classList.add('hidden');
            document.removeEventListener('click', closeMenu);
        }
    };
    
    if (!menu.classList.contains('hidden')) {
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    } else {
        document.removeEventListener('click', closeMenu);
    }
}

function openProfileModal() {
    document.getElementById('settingsMenu').classList.add('hidden'); 
    
    if (userRef) {
        userRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('profileName').value = data.name || "";
                document.getElementById('profilePhone').value = data.phone || "";
            }
        });
    }
    document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
}

async function saveProfileInfo() {
    const newName = document.getElementById('profileName').value.trim();
    const newPhone = document.getElementById('profilePhone').value.trim();

    if (!newName) {
        showCustomAlert("Vui lòng nhập tên hiển thị!", "warning");
        return;
    }

    try {
        await userRef.update({
            name: newName,
            phone: newPhone
        });

        showCustomAlert("Cập nhật hồ sơ thành công!", "success");
        closeProfileModal();
    } catch (error) {
        console.error(error);
        showCustomAlert("Lỗi khi lưu dữ liệu!", "error");
    }
}

function listenToUserProfile() {
    if (userRef) {
        userRef.on('value', (snapshot) => {
            const data = snapshot.val();
            const badge = document.getElementById('userProfileBadge');
            const nameDisplay = document.getElementById('displayUserName');

            if (data && data.name) {
                nameDisplay.innerText = data.name;
                badge.classList.remove('hidden');
                badge.classList.add('flex');
            } else {
                nameDisplay.innerText = employeeId;
                badge.classList.remove('hidden');
                badge.classList.add('flex');
            }
        });
    }
}

document.addEventListener('input', function (e) {
    if (e.target && e.target.classList.contains('crm-textarea')) {
        const target = e.target;
        requestAnimationFrame(() => {
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
        });
    }
});

let searchOrderTimeout;
function debouncedRenderOrder() {
    clearTimeout(searchOrderTimeout);
    searchOrderTimeout = setTimeout(() => {
        renderTable();
    }, 300);
}

let searchCustomerTimeout;
function debouncedRenderCustomerCRM() {
    clearTimeout(searchCustomerTimeout);
    searchCustomerTimeout = setTimeout(() => {
        renderCustomerCRM();
    }, 300);
}
