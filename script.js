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
        let userRef; // Chuyển biến này ra ngoài

      
               // --- BẮT ĐẦU PHẦN XỬ LÝ ĐĂNG NHẬP MỚI ---
        const DEFAULT_PASSWORD = "898989";

   // HÀM XỬ LÝ ĐĂNG NHẬP MỚI (DÙNG FIREBASE)
async function handleLogin() {
    const code = document.getElementById('empCode').value.trim().toUpperCase();
    const pass = document.getElementById('empPassword').value;

    if (!code || !pass) {
        alert("Vui lòng nhập đầy đủ mã và mật khẩu!");
        return;
    }

    try {
        // 1. Lấy mật khẩu từ Firebase (Đúng đường dẫn bạn đang dùng)
        const snapshot = await db.ref('SunsetShopData/Employees/' + code + '/password').once('value');
        const savedPassword = snapshot.val() || "898989"; 

        if (pass === savedPassword) {
            // --- ĐĂNG NHẬP THÀNH CÔNG ---
            
            // 2. Cập nhật biến toàn cục employeeId (Cực kỳ quan trọng)
            employeeId = code; 
            
            // 3. Lưu vào bộ nhớ máy để lần sau không phải đăng nhập lại
            localStorage.setItem('v11_employee_id', employeeId);
            
            // 4. Thiết lập đường dẫn dữ liệu cá nhân cho user này
            userRef = db.ref('SunsetShopData/Employees/' + employeeId);

            
            // 5. Chạy hàm hiển thị tên lên Header (Hàm này bạn đã viết ở Bước 2)
            listenToUserProfile(); 
            
            // 6. Load dữ liệu đơn hàng
            loadData();
            
            // 7. Ẩn bảng đăng nhập để vào app luôn
            document.getElementById('loginModal').classList.add('hidden');

            // LƯU Ý: Xóa dòng window.location.reload() ở đây.
            // Nếu reload, trang web sẽ load lại từ đầu và làm gián đoạn luồng dữ liệu.

        } else {
            // --- SAI MẬT KHẨU ---
            alert("Mã nhân viên hoặc mật khẩu không chính xác!");
            // Không reload ở đây để người dùng nhập lại ngay tại chỗ
        }
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        alert("Có lỗi kết nối: " + error.message);
    }
}



             // MỞ GIAO DIỆN QUÊN MẬT KHẨU
        function handleForgotPassword() {
            const code = document.getElementById('empCode').value.trim();
            
            if (!code) {
                alert("Vui lòng điền Mã nhân viên ở ô phía trên trước để khôi phục mật khẩu!");
                return;
            }

            // Làm sạch ô nhập trước khi mở
            document.getElementById('supplierCodeInput').value = '';
            document.getElementById('newResetPassInput').value = '';
            
            // Hiện Modal kính lỏng
            document.getElementById('forgotPassModal').classList.remove('hidden');
        }

        // ĐÓNG GIAO DIỆN QUÊN MẬT KHẨU
        function closeForgotPassModal() {
            document.getElementById('forgotPassModal').classList.add('hidden');
        }

        // XỬ LÝ LƯU MẬT KHẨU KHI NHẬP ĐÚNG MÃ CỦA NHÀ CUNG CẤP
function submitForgotPassword() {
    const code = document.getElementById('empCode').value.trim().toUpperCase();
    const supplierCode = document.getElementById('supplierCodeInput').value;
    const newPass = document.getElementById('newResetPassInput').value;

    // Kiểm tra mật mã của Duy Khang
    if (supplierCode !== 'admin123') {
        alert("Mã xác thực của nhà cung cấp không chính xác!");
        return;
    }

    if (!newPass) {
        alert("Vui lòng nhập mật khẩu mới mà bạn muốn đổi!");
        return;
    }

    // Lưu mật khẩu mới thẳng vào Firebase của nhân viên đó
    db.ref('SunsetShopData/Employees/' + code + '/password').set(newPass)
        .then(() => {
            alert(`Thành công! Mật khẩu của nhân viên ${code} đã được đổi. Vui lòng đăng nhập lại.`);
            closeForgotPassModal();
            document.getElementById('empPassword').value = ''; 
        })
        .catch((error) => {
            alert("Lỗi khi cấp lại mật khẩu: " + error.message);
        });
}
// MỞ GIAO DIỆN TẠO TÀI KHOẢN
function openRegisterModal() {
    // Làm sạch form trước khi mở
    document.getElementById('regAdminCode').value = '';
    document.getElementById('regEmpCode').value = '';
    document.getElementById('regEmpPassword').value = '';
    
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('hidden'); // Ẩn form login
}

// ĐÓNG GIAO DIỆN TẠO TÀI KHOẢN
function closeRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('hidden'); // Hiện lại form login
}

// XỬ LÝ LƯU TÀI KHOẢN MỚI LÊN FIREBASE
async function submitRegister() {
    const adminCode = document.getElementById('regAdminCode').value;
    const newCode = document.getElementById('regEmpCode').value.trim().toUpperCase();
    const newPass = document.getElementById('regEmpPassword').value;

    // 1. Kiểm tra quyền Admin (Dùng chung mã 'admin123' của Duy Khang)
    if (adminCode !== 'admin123') {
        alert("Mã xác thực Admin không chính xác. Bạn không có quyền tạo tài khoản!");
        return;
    }

    // 2. Validate dữ liệu
    if (!newCode || !newPass) {
        alert("Vui lòng điền đầy đủ Mã nhân viên và Mật khẩu!");
        return;
    }

    try {
        const userNodeRef = db.ref('SunsetShopData/Employees/' + newCode);
        
        // 3. Kiểm tra xem mã nhân viên này đã tồn tại chưa
        const snapshot = await userNodeRef.once('value');
        if (snapshot.exists()) {
            alert("Mã nhân viên này đã tồn tại! Vui lòng chọn mã khác.");
            return;
        }

        // 4. Nếu chưa tồn tại, tiến hành tạo mới. 
        // Thiết lập cấu trúc cơ bản cho nhân viên mới
        await userNodeRef.set({
            password: newPass,
            created_at: new Date().toISOString(),
            status: "active"
            // Hệ thống của bạn sẽ tự động tạo các node v11_orders, v11_customers... khi nhân viên này bắt đầu nhập liệu
        });

        alert(`Tạo tài khoản thành công cho nhân viên: ${newCode}!\nBây giờ bạn có thể đăng nhập.`);
        closeRegisterModal();
        
        // Tự động điền sẵn mã NV vừa tạo vào form đăng nhập cho tiện
        document.getElementById('empCode').value = newCode;
        document.getElementById('empPassword').value = '';

    } catch (error) {
        alert("Có lỗi xảy ra khi tạo tài khoản: " + error.message);
    }
}



        // HÀM XỬ LÝ ĐĂNG XUẤT
        function handleLogout() {
            if(confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản nhân viên hiện tại?\n(Bạn sẽ cần nhập mã mới để vào lại hệ thống)")) {
                localStorage.removeItem('v11_employee_id');
                window.location.reload();
            }
        }

        // KHỞI TẠO DỮ LIỆU KHI ĐÃ CÓ MÃ NHÂN VIÊN
function initDataSync() {
    userRef = db.ref('SunsetShopData/Employees/' + employeeId);
    
    // Gọi hàm này để hiển thị tên nhân viên ở góc phải khi tải trang
    listenToUserProfile(); 

    userRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        orders = data.v11_orders || [];
        
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

        renderTable();
        renderCustomerCRM();
        renderInventory();
        updateProductDatalist();
        updateDatalists();
        
        if(!document.getElementById('view-analytics').classList.contains('hidden')) renderAnalytics();
        if(!document.getElementById('view-cv').classList.contains('hidden')) renderAllCV();

        checkAndShowEvents();
    });
}


        // KIỂM TRA ĐĂNG NHẬP KHI TẢI TRANG
        document.addEventListener('DOMContentLoaded', () => {
            if (!employeeId) {
                // Hiện giao diện đăng nhập nếu chưa có mã
                document.getElementById('loginModal').classList.remove('hidden');
            } else {
                // Có mã rồi thì chạy hệ thống như bình thường
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
            if(!confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè. Hãy chắc chắn bạn đã sao lưu trước đó!")) { input.value = ''; return; }
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
                        alert("Khôi phục thành công! Hệ thống đang tự động đồng bộ."); 
                    } else alert("File lỗi.");
                } catch (err) { alert("Lỗi đọc file: " + err.message); }
            };
            reader.readAsText(file);
        }

        function saveInventory() { userRef.child('v11_inventory').set(inventory); }
        function addInventoryProduct() {
            const name = document.getElementById('invName').value.trim();
            const price = parseCurrency(document.getElementById('invPrice').value);
            const qty = parseInt(document.getElementById('invQty').value) || 0;
            if(!name) return showToast("Nhập tên sản phẩm!");
            const existing = inventory.find(p => p.name.toLowerCase() === name.toLowerCase());
            if(existing) return alert("Sản phẩm đã tồn tại trong kho!");
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
        function deleteInventoryProduct(index) { if(confirm("Xóa sản phẩm này khỏi kho?")) { inventory.splice(index, 1); saveInventory(); } }
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

        function updateProductDatalist() {
            const datalist = document.getElementById('productDataList');
            datalist.innerHTML = inventory.map(p => `<option value="${p.name}">Kho: ${p.qty} | Giá: ${formatMoney(p.price)}</option>`).join('');
        }
      // HÀM MỚI: Xử lý tăng/giảm số lượng bằng nút bấm
function updateQty(btn, change) {
    const input = btn.parentElement.querySelector('.p-qty');
    let currentVal = parseInt(input.value) || 0;
    let newVal = currentVal + change;
    if (newVal < 1) newVal = 1; // Giới hạn không cho giảm dưới 1
    input.value = newVal;
    calculateTotal();
}

// THAY THẾ HÀM addProductRow CŨ
function addProductRow(name = "", price = "", qty = 1) {
    const container = document.getElementById('product-list');
    if (!container) return; 

    const div = document.createElement('div');
    const formattedPrice = price ? new Intl.NumberFormat('en-US').format(price) : "";
    
    // Đã căn chỉnh lại grid-cols để vừa vặn thêm khối Tăng/Giảm
    div.className = "grid grid-cols-1 sm:grid-cols-[2fr,1fr,auto,auto] gap-2 bg-white p-3 border border-soft-pink rounded-xl items-center shadow-sm product-row";
    
    div.innerHTML = `
        <div class="input-group">
            <i class="fa-solid fa-cube input-icon"></i>
            <input type="text" class="form-input p-name" placeholder="Tên SP..." value="${name}" list="productDataList" onchange="autoFillProductPrice(this)">
        </div>
        <div class="input-group">
            <i class="fa-solid fa-money-bill-1-wave input-icon"></i>
            <input type="text" inputmode="numeric" class="form-input p-price font-bold text-[#034C5F]" placeholder="Giá (₫)" value="${formattedPrice}" oninput="formatCurrencyInput(this); calculateTotal()">
        </div>
        
            <div class="flex items-center justify-between border border-[#8dddf7] rounded-xl overflow-hidden bg-white h-[46px]">
            <button type="button" onclick="updateQty(this, -1)" class="px-1 h-full text-[#034C5F] hover:bg-[#97BEC6]/50 transition-colors flex items-center justify-center"><i class="fa-solid fa-minus text-xs"></i></button>
            <input type="number" class="w-10 h-full text-center p-qty font-black text-[#034C5F] outline-none bg-transparent" value="${qty}" min="1" oninput="calculateTotal()" style="-moz-appearance: textfield;">
            <button type="button" onclick="updateQty(this, 1)" class="px-1 h-full text-[#034C5F] hover:bg-[#97BEC6]/50 transition-colors flex items-center justify-center"><i class="fa-solid fa-plus text-xs"></i></button>
        </div>

        <button type="button" onclick="this.parentElement.remove(); calculateTotal()" class="text-[#F9C4BA] hover:text-[#EE6457] p-2 transition-colors flex items-center justify-center"><i class="fa-solid fa-trash-can text-lg"></i></button>
    `;
    container.appendChild(div);
    calculateTotal();
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
        
        // SỬA LỖI 1: Cộng dồn tiền của từng sản phẩm (Giá x Số lượng) vào Tổng tạm tính
        if (el.value) { // Chỉ cộng nếu có nhập tên sản phẩm
            subtotal += price * qty;
        }
    });

    const ship = parseFloat(document.getElementById('shipFee').value) || 0;
    const dVal = parseFloat(document.getElementById('discountVal').value) || 0;
    const dType = document.getElementById('discountType').value;
    
    // Tính số tiền giảm giá
    let disc = dType === 'percent' ? subtotal * (dVal/100) : dVal;
    
    // Phi Van Chuyen
    let total = Math.max(0, subtotal - disc + ship);
    
    // Hiển thị ra giao diện
    document.getElementById('finalTotal').innerText = formatMoney(total);
    
    return { subtotal, total };
}

        function saveOrder() {
            const phone = document.getElementById('custPhone').value.trim();
            const name = document.getElementById('custName').value.trim();
            const addr = document.getElementById('custAddr').value;
            const type = document.getElementById('custType').value;
            const isEdit = document.getElementById('editOrderId').value !== "";
            if(!phone || !name) return alert("Thiếu Tên hoặc SĐT!");
            let products = [];
            let valid = true;
            document.querySelectorAll('.p-name').forEach((el, idx) => {
                const pPrice = document.querySelectorAll('.p-price')[idx].value;
                const pQty = parseInt(document.querySelectorAll('.p-qty')[idx].value) || 1;
                if(!el.value || !pPrice) valid = false;
                products.push({ name: el.value, price: parseCurrency(pPrice) || 0, qty: pQty });
            });
            if(!valid || products.length === 0) return alert("Kiểm tra lại sản phẩm!");
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
            // 1. Tìm đơn hàng cũ trước
const existingOrder = isEdit ? orders.find(x => x.id == id) : null;

// 2. Tạo đối tượng order mới bằng cách sử dụng biến existingOrder đã tìm
const order = { 
    id, 
    // Nếu có đơn cũ thì lấy lại timestamp cũ, không thì lấy thời gian hiện tại
    timestamp: existingOrder ? existingOrder.timestamp : Date.now(), 
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
    // Nếu có đơn cũ thì giữ nguyên trạng thái cũ, không thì mặc định là "Đợi gửi"
    status: existingOrder ? existingOrder.status : "Đợi gửi",
    // Nếu có đơn cũ thì giữ trạng thái thanh toán, không thì mặc định là false
    isPaid: existingOrder ? (existingOrder.isPaid || false) : false 
};

// 3. Cập nhật vào mảng và lưu
if(isEdit) {
    const index = orders.findIndex(o => o.id == id);
    if(index !== -1) orders[index] = order;
} else {
    orders.unshift(order);
}

userRef.update({ 'v11_orders': orders, 'v11_customers': customers, 'v11_inventory': inventory });
resetForm(); 
showToast("Đã lưu đồng bộ thành công!");
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
            
            document.getElementById('orderTableBody').innerHTML = filtered.map(o => {
                const formattedShipDate = o.date ? o.date.split('-').reverse().join('/') : '';
                
                // Xử lý viết tắt hình thức thanh toán
                let shortPayMethod = "COD";
                if (o.payMethod === "Chuyển khoản") shortPayMethod = "CK";
                else if (o.payMethod === "Tiền mặt") shortPayMethod = "TM";

                // Xử lý giao diện nút Đã Thu
                let paidBg = o.isPaid ? "bg-green-500 border-green-600" : "bg-slate-100 border-slate-200";
                let paidIconColor = o.isPaid ? "text-white" : "text-slate-300";

                // THÊM ĐOẠN NÀY: Kiểm tra trạng thái để đổi màu "Ngày gửi"
                let shipDateStyle = o.status === 'Đợi gửi' 
                    ? "bg-[#EE6457]/10 text-[#EE6457] border border-[#EE6457]/30" // Màu cam đỏ mặc định
                    : "bg-slate-100 text-slate-400 border border-slate-200 opacity-60"; // Màu xám nhạt làm mờ

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
                        <span class="${shipDateStyle} font-black px-3 py-1 rounded-lg text-[11px] shadow-sm whitespace-nowrap transition-all">
                            <i class="fa-solid fa-truck-fast mr-1"></i>${formattedShipDate}
                        </span>
                    </td>
                    <td class="p-4 text-center font-black text-[#034C5F] text-xs">
                        ${shortPayMethod}
                    </td>
             <td class="p-4 text-center">
    <select onchange="changeOrderStatus(${o.id}, this.value)" 
        class="text-[11px] font-bold rounded-full px-3 py-1 cursor-pointer transition-all appearance-none border-none outline-none focus:ring-0"
        style="
            background-color: ${getStatusStyles(o.status).bg} !important; 
            color: ${getStatusStyles(o.status).text} !important;
            text-align: center;
            width: auto;
            min-width: 100px;
        ">
        <option value="Đợi gửi" ${o.status === 'Đợi gửi' ? 'selected' : ''} style="background: white; color: #ffffff;">Đợi gửi</option>
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
                        <button onclick="togglePaidStatus(${o.id})" class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${paidBg} ${paidIconColor} hover:scale-110 shadow-sm mx-auto" title="Đánh dấu đã thu tiền">
                            <i class="fa-solid fa-check text-sm"></i>
                        </button>
                    </td>
                    <td class="p-4 text-center">
                        <div class="flex justify-center gap-3">
                            <button onclick="openInvoice(${o.id})" class="text-[#97BEC6] hover:text-[#034C5F]"><i class="fa-solid fa-receipt text-lg"></i></button>
                            <button onclick="editOrder(${o.id})" class="text-[#97BEC6] hover:text-[#034C5F]"><i class="fa-solid fa-pen-to-square text-lg"></i></button>
                            <button onclick="deleteOrder(${o.id})" class="text-slate-200 hover:text-red-400"><i class="fa-solid fa-trash text-lg"></i></button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

    
  function getStatusStyles(status) {
    const styles = {
        'Đợi gửi': { bg: '#f1f5f9', text: '#000000' },      // Xám
        'Đang giao': { bg: '#9ce4ff', text: '#000000' },    // Xanh dương
        'Thành công': { bg: '#a4ff9c', text: '#000000' },   // Xanh lá
        'Chăm sóc': { bg: '#00ffe5', text: '#000000' },     // cam
        'HD sử dụng': { bg: '#fef3c7', text: '#000000' },   // Vàng cam
        'Xử lý': { bg: '#fee2e2', text: '#000000' },        // Đỏ nhạt
        'Đơn BOM 💣': { bg: '#fca5a5', text: '#ffffff' },   // Đỏ đậm
        'Đã Hủy': { bg: '#f3f4f6', text: '#374151' }        // Xám đậm
    };
    return styles[status] || { bg: '#ffffff', text: '#000000' };
}


                function renderAnalytics() {
    const startInput = document.getElementById('filterStart');
    const endInput = document.getElementById('filterEnd');
    
    // --- ĐOẠN CODE THÊM MỚI: ÉP ĐIỀN NGÀY KHI BẤM SANG TAB BÁO CÁO ---
    if (!startInput.value || !endInput.value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Điều chỉnh múi giờ (Timezone) chuẩn Việt Nam để không bị lệch ngày
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        firstDay.setMinutes(firstDay.getMinutes() - firstDay.getTimezoneOffset());
        
        if (!startInput.value) startInput.value = firstDay.toISOString().split('T')[0];
        if (!endInput.value) endInput.value = today.toISOString().split('T')[0];
    }
    // -----------------------------------------------------------------

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
        const net = o.total - o.shipFee; // Lợi nhuận không tính ship
        grandTotal += net;               // Doanh thu tổng giữ nguyên
        
        // CỘNG VÀO ĐÃ THU NẾU ĐƠN CÓ TÍCH XANH (isPaid = true)
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

    // TÍNH TỔNG TIỀN TÍCH LŨY TRONG GIAI ĐOẠN ĐƯỢC CHỌN LỌC
    let sAccumulated = 0;
    cvAccumulations.forEach(acc => {
        if (acc.date && (!start || acc.date >= start) && (!end || acc.date <= end)) {
            sAccumulated += acc.amount;
        }
    });

    // THU NHẬP = ĐÃ THU - TÍCH LŨY
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
    
    // XUẤT RA GIAO DIỆN MỚI
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
        function updateDatalists() { 
            document.getElementById('phoneDataList').innerHTML = Object.keys(customers).map(p => `<option value="${p}">${customers[p].name}</option>`).join('');
            document.getElementById('nameDataList').innerHTML = Object.keys(customers).map(p => `<option value="${customers[p].name}">${p}</option>`).join('');
        }
        function changeOrderStatus(id, newStatus) {
    const o = orders.find(x => x.id === id);
    if (o) {
        o.status = newStatus;
        userRef.child('v11_orders').set(orders);
        // Lưu ý: Dữ liệu sẽ tự động render lại nhờ hàm lắng nghe Firebase on('value') phía trên.
    }
}


        function deleteOrder(id) { if(confirm("Xoá đơn này?")) { orders = orders.filter(o => o.id !== id); userRef.child('v11_orders').set(orders); } }
           // HÀM ĐÁNH DẤU / HỦY ĐÁNH DẤU ĐÃ THU TIỀN
        function togglePaidStatus(id) {
            // Tìm đơn hàng theo ID
            const orderIndex = orders.findIndex(x => x.id === id);
            
            if (orderIndex !== -1) {
                // Đảo ngược trạng thái (chưa thu -> đã thu, đã thu -> chưa thu)
                orders[orderIndex].isPaid = !orders[orderIndex].isPaid;
                
                // Lưu cập nhật lên Firebase
                userRef.child('v11_orders').set(orders);
                
                // Hiện thông báo popup nhỏ
                if(orders[orderIndex].isPaid) {
                    showToast("✅ Đã đánh dấu: ĐÃ THU TIỀN!");
                } else {
                    showToast("❌ Đã hủy đánh dấu thu tiền!");
                }
            }
        }
     
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
    orders.forEach(o => spendings[o.customer.phone] = (spendings[o.customer.phone] || 0) + o.total);
    const CUSTOMER_STATUS_STYLES = { "Vip": "background-color: #fee2e2; color: #dc2626; font-weight: bold; border: 1px solid #f87171;", "Vãn lai": "background-color: #fef9c3; color: #a16207; font-weight: bold; border: 1px solid #facc15;", "Thân Thiết": "background-color: #dcfce7; color: #15803d; font-weight: bold; border: 1px solid #4ade80;", "Đơn 1": "background-color: #dbeafe; color: #1d4ed8; font-weight: bold; border: 1px solid #60a5fa;", "Đơn 2": "background-color: #f3e8ff; color: #7e22ce; font-weight: bold; border: 1px solid #c084fc;", "Đơn 3": "background-color: #fce7f3; color: #be185d; font-weight: bold; border: 1px solid #f472b6;", "Bom": "background-color: #f3f4f6; color: #4b5563; font-weight: bold; border: 1px solid #9ca3af;", "Ngừng kết nối": "background-color: #ffedd5; color: #c2410c; font-weight: bold; border: 1px solid #fb923c;", "Chăm sóc": "background-color: #ecfdf5; color: #047857; font-weight: normal;" };
    const sortMode = document.getElementById('customerSortOrder').value; 
    
    // Đổi hằng số const sang biến let để có thể lọc bớt dữ liệu
    let keys = Object.keys(customers);

    // BẮT ĐẦU: LOGIC TÌM KIẾM
    const searchInput = document.getElementById('searchCustomerInput');
    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase().trim();
        keys = keys.filter(phone => {
            const c = customers[phone];
            // Lọc nếu chuỗi tìm kiếm nằm trong số điện thoại HOẶC tên khách hàng
            return phone.includes(query) || (c && c.name && c.name.toLowerCase().includes(query));
        });
    }
    // KẾT THÚC: LOGIC TÌM KIẾM

    // Sắp xếp dữ liệu (Sau khi đã lọc)
    keys.sort((a, b) => {
        if (sortMode === 'newest') return (customers[b].timestamp || 0) - (customers[a].timestamp || 0);
        else if (sortMode === 'oldest') return (customers[a].timestamp || 0) - (customers[b].timestamp || 0);
        else if (sortMode === 'name') return customers[a].name.localeCompare(customers[b].name);
        else if (sortMode === 'spending') return (spendings[b] || 0) - (spendings[a] || 0); return 0;
    });
    
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDate = String(today.getDate()).padStart(2, '0');
    const todayMMDD = `${todayMonth}-${todayDate}`;

    // Đổ dữ liệu ra màn hình
    tbody.innerHTML = keys.map((phone, index) => {
        const c = customers[phone]; if(!c) return ""; 
        const currentStatus = c.status || 'Vãn lai'; const statusStyle = CUSTOMER_STATUS_STYLES[currentStatus] || "";
        
        let bdayMMDD = c.birthday ? c.birthday.substring(5) : "";
        let isBdayToday = (bdayMMDD === todayMMDD);
        let bdayClass = isBdayToday ? "birthday-today" : "bg-light-pink";

        let anniMMDD = c.anniversary ? c.anniversary.substring(5) : "";
        let isAnniToday = (anniMMDD === todayMMDD);
        let anniClass = isAnniToday ? "anniversary-today" : "bg-light-blue";
        
        return `<tr>
            <td class="p-3 text-center font-bold text-slate-400">${index + 1}</td>
            <td class="p-3"><textarea rows="1" oninput="this.style.height=''; this.style.height = this.scrollHeight + 'px'" onchange="updateCustomerField('${phone}', 'name', this.value)" class="crm-textarea font-bold text-[#034C5F]">${c.name}</textarea></td>
            <td class="p-3">${phone}</td>
            <td class="p-3"><textarea rows="1" oninput="this.style.height=''; this.style.height = this.scrollHeight + 'px'" onchange="updateCustomerField('${phone}', 'address', this.value)" class="crm-textarea">${c.address||''}</textarea></td>
            <td class="p-3"><input type="text" value="${c.birthday||''}" onchange="updateCustomerField('${phone}', 'birthday', this.value)" class="crm-input cursor-pointer flatpickr-date ${bdayClass}" placeholder="DD/MM/YYYY"></td>
            <td class="p-3"><input type="text" value="${c.anniversary||''}" onchange="updateCustomerField('${phone}', 'anniversary', this.value)" class="crm-input cursor-pointer flatpickr-date text-[#EE6457] ${anniClass}" placeholder="DD/MM/YYYY"></td>
            <td class="p-3"><textarea rows="1" oninput="this.style.height=''; this.style.height = this.scrollHeight + 'px'" onchange="updateCustomerField('${phone}', 'job', this.value)" class="crm-textarea">${c.job||''}</textarea></td>
            <td class="p-3"><select onchange="updateCustomerField('${phone}', 'status', this.value); renderCustomerCRM();" class="crm-input rounded-md px-2 py-1 transition-all" style="${statusStyle}"><option value="Vip" ${currentStatus === 'Vip' ? 'selected' : ''}>Vip 🍀</option><option value="Vãn lai" ${currentStatus === 'Vãn lai' ? 'selected' : ''}>Vãn lai 🍃</option><option value="Thân Thiết" ${currentStatus === 'Thân Thiết' ? 'selected' : ''}>Thân thiết 🌺</option><option value="Đơn 1" ${currentStatus === 'Đơn 1' ? 'selected' : ''}> Đơn 1 💙</option><option value="Đơn 2" ${currentStatus === 'Đơn 2' ? 'selected' : ''}> Đơn 2 💜</option><option value="Đơn 3" ${currentStatus === 'Đơn 3' ? 'selected' : ''}> Đơn 3 🩷</option><option value="Bom" ${currentStatus === 'Bom' ? 'selected' : ''}>Bom 💣</option><option value="Ngừng kết nối" ${currentStatus === 'Ngừng kết nối' ? 'selected' : ''}>Ngừng kết nối ❌</option><option value="Chăm sóc" ${currentStatus === 'Chăm sóc' ? 'selected' : ''}>Chăm sóc</option></select></td>
            <td class="p-3"><textarea rows="1" oninput="this.style.height=''; this.style.height = this.scrollHeight + 'px'" onchange="updateCustomerField('${phone}', 'note', this.value)" class="crm-textarea italic text-slate-600">${c.note||''}</textarea></td>
            <td class="p-3 text-right font-black text-[#034C5F]">${formatMoney(spendings[phone]||0)}</td>
            <td class="p-3 text-center"><button onclick="deleteCustomer('${phone}')" class="text-slate-300 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    }).join('');

    // Khởi tạo lại Lịch cho các dòng mới render ra
    if (typeof flatpickr !== "undefined") {
        if (window.datePickerInstances && window.datePickerInstances.length > 0) {
            window.datePickerInstances.forEach(instance => instance.destroy());
        }
        window.datePickerInstances = flatpickr(".flatpickr-date", {
            dateFormat: "Y-m-d",
            altInput: true,
        });
    }
}

        function updateCustomerField(p, f, v) { if(customers[p]) { customers[p][f] = v; saveCRM(); } }
        function deleteCustomer(p) { if(confirm("Bạn có chắc chắn muốn xóa khách hàng này khỏi danh sách?")) { delete customers[p]; saveCRM(); } }
        function resetForm() { document.getElementById('orderForm').reset(); document.getElementById('editOrderId').value = ""; document.getElementById('product-list').innerHTML = ""; addProductRow(); document.getElementById('orderDate').valueAsDate = new Date(); document.getElementById('shipDate').valueAsDate = new Date(); autoSetDeliveryDate(); calculateTotal(); document.getElementById('btnSave').innerHTML = '<i class="fa-solid fa-check-double mr-2"></i>Lưu đơn'; }
        function editOrder(id) { const o = orders.find(x => x.id === id); document.getElementById('editOrderId').value = o.id; document.getElementById('custPhone').value = o.customer.phone; document.getElementById('custName').value = o.customer.name; document.getElementById('custAddr').value = o.customer.addr; document.getElementById('custType').value = o.customer.type || 'new'; document.getElementById('product-list').innerHTML = ""; o.products.forEach(p => addProductRow(p.name, p.price, p.qty)); document.getElementById('payMethod').value = o.payMethod; document.getElementById('shipFee').value = o.shipFee; document.getElementById('discountVal').value = o.discount.val; document.getElementById('discountType').value = o.discount.type; document.getElementById('orderDate').value = o.orderDate || o.date; document.getElementById('shipDate').value = o.date; document.getElementById('deliveryDate').value = o.deliveryDate; document.getElementById('orderNote').value = o.note || ''; document.getElementById('btnSave').innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>Cập nhật'; calculateTotal(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        function closeModal() { document.getElementById('invoiceModal').classList.add('hidden'); }
        // Tìm hàm này trong code của bạn và thay thế phần cấu hình
         function downloadImage() {
    const invoice = document.getElementById('invoiceContent');
    const modal = document.getElementById('invoiceModal');
    
    // Lưu lại style gốc
    const originalOverflow = invoice.style.overflow;
    const originalPadding = invoice.style.paddingBottom;

    // 1. Tạm thời bỏ overflow hidden và nới rộng đáy để html2canvas không cắt nhầm
    invoice.style.overflow = 'visible';
    invoice.style.paddingBottom = "30px";

    // 2. Cuộn modal lên trên cùng để tránh lỗi lệch tọa độ Y
    modal.scrollTop = 0;

    // 3. Dùng setTimeout để đợi trình duyệt vẽ xong layout và font chữ
    setTimeout(() => {
        html2canvas(invoice, {
            scale: 3, // Tăng lên 3 để ảnh xuất ra cực nét, không bị vỡ chữ
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            scrollY: 0, // Bắt buộc phải có: Reset tọa độ cuộn
            scrollX: 0,
            allowTaint: true
        }).then(canvas => {
            const link = document.createElement('a');
            const timeStr = new Date().getTime(); // Đặt tên file theo thời gian để không trùng
            link.download = `HoaDon_${timeStr}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

            // Trả lại giao diện như cũ
            invoice.style.overflow = originalOverflow || '';
            invoice.style.paddingBottom = originalPadding || '';
            showToast("Đã lưu ảnh hóa đơn thành công!");
        }).catch(err => {
            console.error("Lỗi xuất ảnh:", err);
            invoice.style.overflow = originalOverflow || '';
            invoice.style.paddingBottom = originalPadding || '';
            showToast("Có lỗi xảy ra khi lưu ảnh!");
        });
    }, 200); // Đợi 200 mili-giây
}
function openInvoice(id) { 
    const o = orders.find(x => x.id === id); 
    
    // Đã thêm line-height và padding cho phần ghi chú
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
                document.getElementById('btnSaveCVAcc').innerText = "THÊM";
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
            if(confirm("Xóa dòng tích lũy này?")) {
                cvAccumulations = cvAccumulations.filter(a => a.id !== id);
                saveCVSync();
                renderAllCV();
            }
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

    // Xử lý nối chuỗi Ghi chú chủ động kèm Lần nhập (VD: "Lần 1 (Chuyển khoản thêm)")
    let finalNote = "";
    if (entryType === "Ghi đè") {
        finalNote = manualNote; 
    } else {
        finalNote = manualNote ? `${entryType} (${manualNote})` : entryType;
    }

    if (entryType === "Ghi đè") {
        // CHẾ ĐỘ 1: GHI ĐÈ TOÀN BỘ (Dùng khi bạn bấm nút Sửa trên bảng để chốt lại 1 con số cuối cùng)
        cvMonthlyStats[monthPick] = {
            cv: cv,
            importAmt: importAmt,
            note: finalNote
        };
        showToast("Đã ghi đè lại toàn bộ số liệu tháng!");
    } else {
        // CHẾ ĐỘ 2: LẦN 1, LẦN 2... CỘNG GỘP TỰ ĐỘNG
        if (cvMonthlyStats[monthPick]) {
            // Nếu đã có dữ liệu -> Cộng dồn giá trị
            cvMonthlyStats[monthPick].cv = (cvMonthlyStats[monthPick].cv || 0) + cv;
            cvMonthlyStats[monthPick].importAmt = (cvMonthlyStats[monthPick].importAmt || 0) + importAmt;
            
            // Nối tiếp ghi chú mới vào ghi chú cũ
            let oldNote = cvMonthlyStats[monthPick].note || "";
            cvMonthlyStats[monthPick].note = oldNote ? (oldNote + " | " + finalNote) : finalNote;
        } else {
            // Nếu chưa có tháng này -> Tạo mới
            cvMonthlyStats[monthPick] = {
                cv: cv,
                importAmt: importAmt,
                note: finalNote
            };
        }
        showToast(`Đã cộng gộp thành công (${entryType})!`);
    }

    // Xóa rỗng các ô sau khi lưu xong
    document.getElementById('cvMonthCV').value = '';
    document.getElementById('cvMonthImport').value = '';
    document.getElementById('cvMonthNote').value = '';
    document.getElementById('cvMonthEntry').value = 'Lần 1'; // Reset ô chọn về Lần 1
    
    // Đưa nút LƯU về trạng thái gốc
    document.getElementById('btnSaveCVMonth').innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> LƯU THÁNG';
    document.getElementById('btnSaveCVMonth').classList.replace('bg-amber-500', 'bg-[#EE6457]');

    saveCVSync();
    renderAllCV();
}

function editCVMonthlyStat(monthKey) {
    let stat = cvMonthlyStats[monthKey];
    if(!stat) return;
    
    // Đẩy dữ liệu cũ lên form
    document.getElementById('cvMonthPick').value = monthKey;
    document.getElementById('cvMonthCV').value = new Intl.NumberFormat('en-US').format(stat.cv || 0);
    document.getElementById('cvMonthImport').value = new Intl.NumberFormat('en-US').format(stat.importAmt || 0);
    document.getElementById('cvMonthNote').value = stat.note || '';
    
    // Tự động chuyển Dropdown sang "Ghi đè" và đổi màu nút để nhắc nhở
    document.getElementById('cvMonthEntry').value = 'Ghi đè';
    let btnSave = document.getElementById('btnSaveCVMonth');
    btnSave.innerHTML = '<i class="fa-solid fa-pen mr-1"></i> GHI ĐÈ TỔNG';
    btnSave.classList.replace('bg-[#EE6457]', 'bg-amber-500'); // Đổi màu cảnh báo
    
    document.getElementById('cvMonthPick').scrollIntoView({ behavior: 'smooth', block: 'center' });
}


        function deleteCVMonthlyStat(monthKey) {
            if(confirm(`Xóa thống kê của tháng ${monthKey}?`)) {
                delete cvMonthlyStats[monthKey];
                saveCVSync();
                renderAllCV();
            }
        }

        function initCVSummaryFilters() {
            let yearSelect = document.getElementById('cvSumYear');
            let tableYearSelect = document.getElementById('cvMonthTableFilterYear'); // Bộ lọc bảng tháng mới
            let currentYear = new Date().getFullYear();
            let yearsHtml = `<option value="all">Tất cả các năm</option>`;
            
            for(let y = currentYear - 6; y <= currentYear + 2; y++) {
                yearsHtml += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>Năm ${y}</option>`;
            }
            
            if(yearSelect) yearSelect.innerHTML = yearsHtml;
            if(tableYearSelect) tableYearSelect.innerHTML = yearsHtml; // Render năm cho cả 2 bộ lọc
        }

        function renderCVMonthlyStats() {
            const tbody = document.getElementById('cvMonthTableBody');
            if(!tbody) return;
            
            // Lấy giá trị của bộ lọc năm mới tạo
            const filterYearElement = document.getElementById('cvMonthTableFilterYear');
            const filterYear = filterYearElement ? filterYearElement.value : 'all';
            
            let allMonths = new Set(Object.keys(cvMonthlyStats));
            cvAccumulations.forEach(acc => {
                if(acc.date) allMonths.add(acc.date.substring(0,7));
            });

            // Sắp xếp tháng giảm dần
            let sortedMonths = Array.from(allMonths).sort((a,b) => b.localeCompare(a));

            // Lọc tháng hiển thị theo Năm đã chọn
            if(filterYear !== 'all') {
                sortedMonths = sortedMonths.filter(month => month.startsWith(filterYear));
            }

            tbody.innerHTML = sortedMonths.map(month => {
                let stat = cvMonthlyStats[month] || { cv: 0, importAmt: 0, note: '' };
                let totalAcc = getSumAccumulationForMonth(month);
                let remaining = totalAcc - stat.importAmt;
                
                // Hiển thị ghi chú nếu có, không thì để trống
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
                    
// Xử lý báo trạng thái trống nếu lọc không có dữ liệu
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

    if (typeof autoSetDeliveryDate === 'function') autoSetDeliveryDate(); 
    
    // Tự động gọi hiển thị sẵn 1 dòng sản phẩm đầu tiên khi vào trang
    const productList = document.getElementById('product-list');
    if (productList && productList.children.length === 0) {
        addProductRow();
    }
});


   
  // 1. Đóng/Mở Menu Bánh Răng
function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    menu.classList.toggle('hidden');
    
    // Hàm tự động đóng menu nếu bấm ra ngoài
    const closeMenu = (e) => {
        if (!document.getElementById('settingsMenuContainer').contains(e.target)) {
            menu.classList.add('hidden');
            document.removeEventListener('click', closeMenu);
        }
    };
    
    // Chỉ kích hoạt event lắng nghe sau khi menu đã mở
    if (!menu.classList.contains('hidden')) {
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
    } else {
        document.removeEventListener('click', closeMenu);
    }
}


// 2. Mở/Đóng Modal Đổi mật khẩu
function openChangePassModal() {
    document.getElementById('settingsMenu').classList.add('hidden'); // Đóng menu bánh răng
    document.getElementById('changePassModal').classList.remove('hidden');
}

function closeChangePassModal() {
    document.getElementById('changePassModal').classList.add('hidden');
    document.getElementById('newPassInput').value = '';
}

// 3. Lưu mật khẩu mới chủ động
// LƯU MẬT KHẨU MỚI (ĐỔI TRONG CÀI ĐẶT)
function saveNewPassword() {
    const newPass = document.getElementById('newPassInput').value.trim();
    const currentEmpId = localStorage.getItem('v11_employee_id'); 

    if (!newPass) {
        alert("Vui lòng nhập mật khẩu mới!");
        return;
    }

    if (currentEmpId) {
        // Đẩy mật khẩu mới lên Firebase
        db.ref('SunsetShopData/Employees/' + currentEmpId + '/password').set(newPass)
            .then(() => {
                alert("Đã đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.");
                closeChangePassModal();
            })
            .catch((error) => {
                alert("Lỗi khi lưu mật khẩu: " + error.message);
            });
    } else {
        alert("Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!");
    }
}


// 4. Hàm Đăng xuất
function handleLogout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
        localStorage.removeItem('v11_employee_id');
        window.location.reload();
    }
}
// Hàm giới hạn năm hiển thị cho các ô chọn Ngày/Tháng và Cài đặt mặc định
function optimizeNativeDatePickers() {
    const currentYear = new Date().getFullYear();
    const minYear = 2018;
    const maxYear = currentYear + 2;

    const accDate = document.getElementById('cvAccDate');
    const monthPick = document.getElementById('cvMonthPick');

    // 1. Cấu hình ô Ngày (Giới hạn bánh xe cuộn từ 2018 đến Hiện tại + 2)
    if (accDate) {
        accDate.min = `${minYear}-01-01`;
        accDate.max = `${maxYear}-12-31`;
        
        // Tự động điền ngày hôm nay cho nhanh nếu ô đang trống
        if (!accDate.value) {
            const today = new Date();
            // Điều chỉnh múi giờ cho chuẩn Việt Nam
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            accDate.value = today.toISOString().split('T')[0];
        }
    }

    // 2. Cấu hình ô Tháng
    if (monthPick) {
        monthPick.min = `${minYear}-01`;
        monthPick.max = `${maxYear}-12`;

        // Tự động điền tháng hiện tại nếu ô đang trống
        if (!monthPick.value) {
            const today = new Date();
            let m = today.getMonth() + 1;
            let y = today.getFullYear();
            monthPick.value = `${y}-${m.toString().padStart(2, '0')}`;
        }
    }

    // 3. THIẾT LẬP MẶC ĐỊNH CHO BỘ LỌC BÁO CÁO (Từ mùng 1 đến Hôm nay)
    const filterStart = document.getElementById('filterStart');
    const filterEnd = document.getElementById('filterEnd');
    
    if (filterStart && filterEnd) {
        const todayFilter = new Date();
        const firstDayFilter = new Date(todayFilter.getFullYear(), todayFilter.getMonth(), 1);
        
        // Điều chỉnh múi giờ (Timezone) để tránh bị lùi ngày 
        firstDayFilter.setMinutes(firstDayFilter.getMinutes() - firstDayFilter.getTimezoneOffset());
        todayFilter.setMinutes(todayFilter.getMinutes() - todayFilter.getTimezoneOffset());
        
        // Chỉ gán giá trị mặc định nếu ô đang trống (cho phép người dùng tự đổi ngày khác)
        if (!filterStart.value) {
            filterStart.value = firstDayFilter.toISOString().split('T')[0];
        }
        if (!filterEnd.value) {
            filterEnd.value = todayFilter.toISOString().split('T')[0];
        }
    }
}

// Gọi hàm ngay khi web load xong
document.addEventListener('DOMContentLoaded', optimizeNativeDatePickers);

// TÍNH NĂNG THÔNG BÁO SINH NHẬT & KỶ NIỆM
// ========================================================

function checkAndShowEvents() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() trả về 0-11
    const currentYear = today.getFullYear();

    let events = [];

    // Quét toàn bộ khách hàng
    for (const phone in customers) {
        const c = customers[phone];
        
        // 1. Kiểm tra Sinh nhật
        if (c.birthday) {
            const [bYear, bMonth, bDay] = c.birthday.split('-');
            if (parseInt(bMonth) === currentMonth) {
                const age = currentYear - parseInt(bYear);
                events.push({
                    type: 'birthday',
                    name: c.name,
                    phone: phone,
                    date: `${bDay}/${bMonth}`,
                    number: age > 0 ? age : 0, // Tuổi
                    sortDay: parseInt(bDay)
                });
            }
        }

        // 2. Kiểm tra Kỷ niệm (Chỉ lấy >= 1 năm)
        if (c.anniversary) {
            const [aYear, aMonth, aDay] = c.anniversary.split('-');
            if (parseInt(aMonth) === currentMonth) {
                const years = currentYear - parseInt(aYear);
                if (years >= 1) { // Điều kiện >= 1 năm
                    events.push({
                        type: 'anniversary',
                        name: c.name,
                        phone: phone,
                        date: `${aDay}/${aMonth}`,
                        number: years, // Số năm kỷ niệm
                        sortDay: parseInt(aDay)
                    });
                }
            }
        }
    }

    // Sắp xếp sự kiện theo ngày tăng dần trong tháng
    events.sort((a, b) => a.sortDay - b.sortDay);

    // Render ra UI
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

// Hàm mở/đóng danh sách thông báo
function toggleNotificationMenu() {
    const menu = document.getElementById('notificationMenu');
    menu.classList.toggle('hidden');
    
    // Đóng luôn menu cài đặt nếu đang mở để tránh đè lên nhau
    document.getElementById('settingsMenu').classList.add('hidden');
    
    // Đóng khi click ra ngoài
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

// Cập nhật lại hàm toggleSettingsMenu cũ để nó cũng tự động đóng bảng thông báo
function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    menu.classList.toggle('hidden');
    
    // THÊM DÒNG NÀY: Đóng bảng thông báo nếu đang mở
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
// 1. Hàm mở Modal và lấy dữ liệu cũ từ Firebase đổ vào Input
function openProfileModal() {
    document.getElementById('settingsMenu').classList.add('hidden'); // Đóng menu bánh răng
    
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

// 2. Hàm đóng Modal
function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
}

// 3. Hàm lưu dữ liệu lên Firebase
async function saveProfileInfo() {
    const newName = document.getElementById('profileName').value.trim();
    const newPhone = document.getElementById('profilePhone').value.trim();

    if (!newName) {
        alert("Vui lòng nhập tên hiển thị!");
        return;
    }

    try {
        // Cập nhật vào đúng node của nhân viên đang đăng nhập
        await userRef.update({
            name: newName,
            phone: newPhone
        });

        alert("Cập nhật hồ sơ thành công!");
        closeProfileModal();
        // Giao diện sẽ tự cập nhật nhờ hàm lắng nghe .on('value') bên dưới
    } catch (error) {
        console.error(error);
        alert("Lỗi khi lưu dữ liệu!");
    }
}

// 4. Hàm lắng nghe thay đổi để hiển thị lên Header (QUAN TRỌNG)
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
                // Nếu chưa có tên thì hiện Mã NV tạm thời
                nameDisplay.innerText = employeeId;
                badge.classList.remove('hidden');
                badge.classList.add('flex');
            }
        });
    }
}
