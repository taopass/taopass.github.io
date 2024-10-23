// app.js

// JsonStorage.net 的 API URL
const baseURL = 'https://api.jsonstorage.net/v1/json';
let storeURL = '';  // 存储您的数据的唯一URL
let jsonId = '';    // 存储数据的 JSON ID

const masterPasswordInput = document.getElementById('master-password-input');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');

const siteInput = document.getElementById('site-input');
const passwordInput = document.getElementById('password-input');
const addButton = document.getElementById('add-button');
const passwordTableBody = document.querySelector('#password-table tbody');

let masterPassword = '';
let passwordList = {};

loginButton.addEventListener('click', function () {
    masterPassword = masterPasswordInput.value;
    if (masterPassword === '') {
        alert('主密码不能为空！');
        return;
    }
    // 使用 SHA-256 生成一个唯一的 storeURL
    const hash = CryptoJS.SHA256(masterPassword).toString();
    // 假设使用 hash 前 32 位作为 jsonId
    jsonId = hash.substring(0, 32);
    storeURL = `${baseURL}/${jsonId}`;

    // 加载数据
    fetch(storeURL)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                // 如果数据不存在，返回空对象
                return {};
            }
        })
        .then(data => {
            try {
                if (data.encryptedData) {
                    const decryptedData = CryptoJS.AES.decrypt(data.encryptedData, masterPassword).toString(CryptoJS.enc.Utf8);
                    passwordList = JSON.parse(decryptedData);
                } else {
                    passwordList = {};
                }
            } catch (e) {
                passwordList = {};
            }
            renderPasswordTable();
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
            masterPasswordInput.value = '';
        })
        .catch(error => {
            console.error('加载数据失败：', error);
            passwordList = {};
            renderPasswordTable();
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
            masterPasswordInput.value = '';
        });
});

logoutButton.addEventListener('click', function () {
    masterPassword = '';
    storeURL = '';
    jsonId = '';
    passwordList = {};
    passwordTableBody.innerHTML = '';
    appContainer.style.display = 'none';
    loginContainer.style.display = 'block';
});

addButton.addEventListener('click', function () {
    const site = siteInput.value.trim();
    const password = passwordInput.value.trim();
    if (site === '' || password === '') {
        alert('网站名称和口令不能为空！');
        return;
    }
    passwordList[site] = password;
    savePasswords();
    renderPasswordTable();
    siteInput.value = '';
    passwordInput.value = '';
});

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
            navigator.clipboard.writeText(passwordList[site]).then(function () {
                alert('口令已复制到剪贴板！');
            }, function (err) {
                alert('复制失败：', err);
            });
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

function savePasswords() {
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(passwordList), masterPassword).toString();

    // 保存数据到 JsonStorage.net
    fetch(storeURL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ encryptedData: encryptedData })
    })
        .then(response => response.json())
        .then(data => {
            console.log('数据已保存：', data);
        })
        .catch(error => {
            console.error('保存数据失败：', error);
        });
}
