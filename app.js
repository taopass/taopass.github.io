document.addEventListener('DOMContentLoaded', function () {
    // 获取 DOM 元素
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const masterPasswordInput = document.getElementById('master-password-input');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const siteInput = document.getElementById('site-input');
    const passwordInput = document.getElementById('password-input');
    const addButton = document.getElementById('add-button');
    const passwordTableBody = document.querySelector('#password-table tbody');
    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importFileInput = document.getElementById('import-file-input');

    let masterPassword = '';
    let passwordList = {};

    // 登录功能
    loginButton.addEventListener('click', function () {
        masterPassword = masterPasswordInput.value;
        if (masterPassword === '') {
            alert('主密码不能为空！');
            return;
        }
        // 尝试加载已保存的口令
        loadPasswords();
        // 切换界面
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        masterPasswordInput.value = '';
    });

    // 退出登录
    logoutButton.addEventListener('click', function () {
        // 清空敏感信息
        masterPassword = '';
        siteInput.value = '';
        passwordInput.value = '';
        passwordList = {};
        passwordTableBody.innerHTML = '';
        // 切换界面
        appContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // 添加新口令
    addButton.addEventListener('click', function () {
        const site = siteInput.value.trim();
        const password = passwordInput.value.trim();
        if (site === '' || password === '') {
            alert('网站名称和口令不能为空！');
            return;
        }
        passwordList[site] = password;
        // 保存到本地存储
        savePasswords();
        // 更新口令列表
        renderPasswordTable();
        // 清空输入框
        siteInput.value = '';
        passwordInput.value = '';
    });

    // 渲染口令表格
    function renderPasswordTable() {
        passwordTableBody.innerHTML = '';
        for (const site in passwordList) {
            const tr = document.createElement('tr');
            const siteTd = document.createElement('td');
            siteTd.textContent = site;
            const actionTd = document.createElement('td');

            // 复制按钮
            const copyBtn = document.createElement('button');
            copyBtn.textContent = '复制';
            copyBtn.addEventListener('click', function () {
                copyToClipboard(passwordList[site]);
            });

            // 删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', function () {
                if (confirm(`确认删除 ${site} 的口令吗？`)) {
                    delete passwordList[site];
                    savePasswords();
                    renderPasswordTable();
                }
            });

            actionTd.appendChild(copyBtn);
            actionTd.appendChild(deleteBtn);
            tr.appendChild(siteTd);
            tr.appendChild(actionTd);
            passwordTableBody.appendChild(tr);
        }
    }

    // 保存口令到本地存储
    function savePasswords() {
        const data = JSON.stringify(passwordList);
        // 使用主密码加密数据
        const encryptedData = CryptoJS.AES.encrypt(data, masterPassword).toString();
        localStorage.setItem('passwords', encryptedData);
    }

    // 加载口令
    function loadPasswords() {
        const encryptedData = localStorage.getItem('passwords');
        if (encryptedData) {
            try {
                // 使用主密码解密数据
                const bytes = CryptoJS.AES.decrypt(encryptedData, masterPassword);
                const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
                passwordList = JSON.parse(decryptedData);
                renderPasswordTable();
            } catch (e) {
                alert('主密码错误或数据已损坏，无法解密已保存的口令！');
                passwordList = {};
            }
        }
    }

    // 复制口令到剪贴板
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function () {
            alert('口令已复制到剪贴板！');
        }, function (err) {
            alert('复制失败：', err);
        });
    }

    // 导出数据
    exportButton.addEventListener('click', function () {
        const data = localStorage.getItem('passwords');
        if (!data) {
            alert('没有可导出的数据！');
            return;
        }
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'passwords.enc';
        a.click();
        URL.revokeObjectURL(url);
    });

    // 导入数据
    importButton.addEventListener('click', function () {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', function () {
        const file = importFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const importedData = e.target.result;
            localStorage.setItem('passwords', importedData);
            loadPasswords();
            alert('数据导入成功！请使用您的主密码解密。');
        };
        reader.readAsText(file);
    });
});
