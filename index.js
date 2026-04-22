import { getContext, extension_settings } from '../../../../scripts/extensions.js';
import { generateRaw } from '../../../../scripts/llm.js'; // 使用酒馆原生的生成函数

const extensionName = 'st-char-phone';
let phoneDataCache = {};
let currentPasscode = "";

jQuery(async function () {
    // 1. 注入 HTML 到 DOM (假设已通过 $.get 加载了 index.html 文本内容)
    const htmlUrl = `./scripts/extensions/${extensionName}/index.html`;
    const htmlContent = await $.get(htmlUrl);
    $('body').append(htmlContent);
    $('#st-char-phone-wrapper').show();

    // 2. 绑定拖拽逻辑 (参考 mobile 悬浮窗)
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    const wrapper = document.getElementById('st-char-phone-wrapper');
    const handle = document.getElementById('phone-drag-handle');

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        offset.x = e.clientX - wrapper.getBoundingClientRect().left;
        offset.y = e.clientY - wrapper.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wrapper.style.left = (e.clientX - offset.x) + 'px';
        wrapper.style.top = (e.clientY - offset.y) + 'px';
        wrapper.style.right = 'auto'; // 取消默认的 right
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    // 3. UI 初始化与锁屏逻辑
    window.showPasscode = () => {
        document.getElementById('lock-screen').style.display = "none";
        document.getElementById('passcode-screen').style.display = "flex";
        currentPasscode = "";
        updateDots();
    };

    window.inputPasscode = (num) => {
        if(currentPasscode.length < 4) currentPasscode += num;
        updateDots();
        if(currentPasscode.length === 4) {
            if(currentPasscode === "0000") { // 默认密码
                document.getElementById('passcode-screen').style.display = "none";
                document.getElementById('home-screen').style.display = "block";
            } else {
                alert("密码错误");
                currentPasscode = ""; updateDots();
            }
        }
    };

    window.cancelPasscode = () => {
        document.getElementById('passcode-screen').style.display = "none";
        document.getElementById('lock-screen').style.display = "flex";
    };

    function updateDots() {
        const dots = document.querySelectorAll('.passcode-dots .dot');
        dots.forEach((dot, index) => {
            dot.className = 'dot' + (index < currentPasscode.length ? ' filled' : '');
        });
    }

    // 4. 应用打开与返回桌面
    window.openApp = (appId) => {
        const win = document.getElementById(`win-${appId}`);
        if(win) {
            win.style.display = 'flex';
            setTimeout(() => win.classList.add('open'), 10);
            if(appId === 'wechat' || appId === 'notes') {
                document.getElementById('status-bar').style.color = '#000';
            } else {
                document.getElementById('status-bar').style.color = '#fff'; // Bank等是黑底
            }
        }
    };

    window.closeApp = () => {
        document.querySelectorAll('.window.open').forEach(win => {
            win.classList.remove('open');
            setTimeout(() => win.style.display = 'none', 400);
        });
        document.getElementById('status-bar').style.color = '#fff'; // 返回桌面变白
    };

    // 5. 核心：调用酒馆大模型生成手机数据
    window.generatePhoneData = async () => {
        const context = getContext();
        const charId = context.characterId;
        if(charId === undefined) return alert("请先选择一个角色！");

        const char = context.characters[charId];
        const persona = char.personality || char.description; // 读取人设
        const world = char.mes_example || ""; // 可以拼接其他设定

        $('#wechat-list').html('<div class="ai-loading">正在通过 AI 生成手机数据...</div>');

        // 构建促使 LLM 输出 JSON 的 Prompt
        const prompt = `
你现在是一个数据生成接口。请仔细阅读以下角色的设定，并严格按照 JSON 格式输出该角色手机中的隐私内容。不要输出任何除了 JSON 之外的说明文本。

角色名字: ${char.name}
角色设定: ${persona}
世界观/背景: ${world}

要求生成的 JSON 格式如下：
{
  "wechat": [
    {"name": "NPC名字1", "msg": "符合设定的查岗或日常消息", "time": "10:30"},
    {"name": "NPC名字2", "msg": "...", "time": "昨天"}
  ],
  "bank": {
    "balance": "1,250,000.00",
    "transactions": [
      {"desc": "符合身份的高端消费(如SKP/豪车保养)", "amount": "-50,000"},
      {"desc": "...", "amount": "..."}
    ]
  },
  "notes": [
    {"content": "符合人设的私密心情或备忘录1", "date": "4月20日"},
    {"content": "备忘录2", "date": "4月19日"}
  ]
}
`;

        try {
            // 使用 ST 原生的生成 API (generateRaw 会直接请求当前连接的大模型)
            console.log("Requesting phone data from LLM...");
            const result = await generateRaw(prompt, true); // true 表示静默生成，不上屏
            
            // 提取 JSON
            const jsonStr = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);
            phoneDataCache = data;
            
            renderPhoneData(data);
            alert("数据生成完毕！");
        } catch(e) {
            console.error("手机数据生成失败", e);
            $('#wechat-list').html('<div class="ai-loading" style="color:red">数据生成失败，请检查模型连接或控制台报错。</div>');
        }
    };

    // 6. 渲染生成的 JSON 数据到 UI
    function renderPhoneData(data) {
        // 渲染微信
        if(data.wechat) {
            $('#wechat-list').html(data.wechat.map(chat => `
                <div class="wechat-msg">
                    <div class="wechat-avatar"></div>
                    <div class="wechat-info">
                        <div class="wechat-name">${chat.name} <span style="float:right; font-size:12px; color:#ccc">${chat.time}</span></div>
                        <div class="wechat-text">${chat.msg}</div>
                    </div>
                </div>
            `).join(''));
        }

        // 渲染银行
        if(data.bank) {
            $('#bank-balance').text(data.bank.balance);
            $('#bank-list').html(data.bank.transactions.map(t => `
                <div class="bank-row">
                    <div>${t.desc}<div style="font-size:12px; color:#555; margin-top:4px">交易成功</div></div>
                    <div style="color:${t.amount.includes('-') ? '#fff' : '#D4AF37'}; font-size:16px">${t.amount}</div>
                </div>
            `).join(''));
        }

        // 渲染备忘录
        if(data.notes) {
            $('#notes-list').html(data.notes.map(note => `
                <div class="note-item">
                    ${note.content}
                    <div class="note-time">${note.date}</div>
                </div>
            `).join(''));
        }
    }

    // 初始化时生成图标（复用你的图标系统）
    const icons = {
        wechat: "https://github.com/yan022715/iPhoneURL/raw/main/C5E580CF-B57B-4771-BFD7-4DB914305109.png",
        bank: "https://github.com/yan022715/iPhoneURL/raw/main/63EDF9D3-932C-4516-B1AE-D49C5568BEFC.png",
        notes: "https://github.com/yan022715/iPhoneURL/raw/main/4FA0C4B7-DC12-41C3-B7EA-DB9754528BF6.png",
        settings: "https://github.com/yan022715/iPhoneURL/raw/main/63C18191-2970-4495-BBE9-15F0BD83E81D.png"
    };
    
    $('#main-grid').html(`
        <div class="app-item" onclick="openApp('settings')"><div class="app-icon" style="background-image:url(${icons.settings})"></div><span class="app-name">设置</span></div>
        <div class="app-item" onclick="openApp('notes')"><div class="app-icon" style="background-image:url(${icons.notes})"></div><span class="app-name">备忘录</span></div>
        <div class="app-item" onclick="openApp('bank')"><div class="app-icon" style="background-image:url(${icons.bank})"></div><span class="app-name">工商银行</span></div>
    `);
    
    $('#dock-grid').html(`
        <div class="app-item" onclick="openApp('wechat')"><div class="app-icon" style="background-image:url(${icons.wechat})"></div></div>
    `);
});
