import { getContext } from '../../../../scripts/extensions.js';
import { generateRaw } from '../../../../scripts/llm.js';

const extensionName = 'st-char-phone';
const extensionFolderPath = `scripts/extensions/${extensionName}`;

jQuery(async function () {
    // 1. 强力注入 CSS (使用绝对路径)
    $('head').append(`<link rel="stylesheet" href="/${extensionFolderPath}/style.css">`);

    // 2. 强力注入 HTML
    try {
        const htmlContent = await $.get(`/${extensionFolderPath}/index.html`);
        $('body').append(htmlContent);
    } catch (error) {
        console.error("[Char Phone] HTML 加载失败，请检查文件夹名称是否为 st-char-phone", error);
        return;
    }

    // 3. 创建悬浮球 📱
    const fab = $(`
        <div id="char-phone-fab" style="
            position: fixed; bottom: 80px; right: 20px; z-index: 99998;
            width: 50px; height: 50px; background: rgba(255,255,255,0.8);
            backdrop-filter: blur(10px); border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            font-size: 28px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer; transition: 0.2s; border: 1px solid rgba(0,0,0,0.1);
        ">📱</div>
    `);
    $('body').append(fab);

    // 4. 悬浮球点击逻辑：收放自如
    const wrapper = $('#st-char-phone-wrapper');
    fab.on('click', () => {
        if (wrapper.css('display') === 'none') {
            wrapper.fadeIn(200);
            fab.css('transform', 'scale(0.9)');
            setTimeout(() => fab.css('transform', 'scale(1)'), 200);
        } else {
            wrapper.fadeOut(200);
        }
    });

    // 5. 拖拽逻辑 (参考 mobile 仓库)
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    const handle = document.getElementById('phone-drag-handle');
    const phoneDOM = document.getElementById('st-char-phone-wrapper');

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        offset.x = e.clientX - phoneDOM.getBoundingClientRect().left;
        offset.y = e.clientY - phoneDOM.getBoundingClientRect().top;
    });
    
    // 兼容移动端触摸拖拽
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        offset.x = touch.clientX - phoneDOM.getBoundingClientRect().left;
        offset.y = touch.clientY - phoneDOM.getBoundingClientRect().top;
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        phoneDOM.style.left = (e.clientX - offset.x) + 'px';
        phoneDOM.style.top = (e.clientY - offset.y) + 'px';
        phoneDOM.style.transform = 'none'; // 拖拽时取消居中居中定位
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        phoneDOM.style.left = (touch.clientX - offset.x) + 'px';
        phoneDOM.style.top = (touch.clientY - offset.y) + 'px';
        phoneDOM.style.transform = 'none';
    }, { passive: true });

    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);

    // ================= 以下为 UI 与 API 交互逻辑 =================

    // 解锁与应用切换
    window.showPasscode = () => {
        $('#lock-screen').hide();
        $('#passcode-screen').css('display', 'flex');
        window.currentPasscode = ""; updateDots();
    };

    window.inputPasscode = (num) => {
        if(window.currentPasscode.length < 4) window.currentPasscode += num;
        updateDots();
        if(window.currentPasscode.length === 4) {
            if(window.currentPasscode === "0000") { // 默认密码 0000
                $('#passcode-screen').hide();
                $('#home-screen').show();
            } else {
                alert("密码错误 (默认0000)");
                window.currentPasscode = ""; updateDots();
            }
        }
    };
    window.cancelPasscode = () => { $('#passcode-screen').hide(); $('#lock-screen').css('display', 'flex'); };

    function updateDots() {
        $('.passcode-dots .dot').each((i, el) => {
            $(el).toggleClass('filled', i < window.currentPasscode.length);
        });
    }

    window.openApp = (appId) => {
        const win = $(`#win-${appId}`);
        if(win.length) {
            win.css('display', 'flex');
            setTimeout(() => win.addClass('open'), 10);
            // 状态栏颜色适配
            $('#status-bar').css('color', (appId === 'wechat' || appId === 'notes') ? '#000' : '#fff');
        }
    };

    window.closeApp = () => {
        $('.window.open').removeClass('open');
        setTimeout(() => $('.window').hide(), 400);
        $('#status-bar').css('color', '#fff');
    };

    // 核心：调用酒馆大模型生成手机数据
    window.generatePhoneData = async () => {
        const context = getContext();
        const charId = context.characterId;
        if(charId === undefined) return alert("请先选择一个角色！");

        const char = context.characters[charId];
        const persona = char.personality || char.description; 

        $('#wechat-list').html('<div class="ai-loading" style="padding:20px; text-align:center; color:#999;">正在黑入角色手机同步数据...<br>这需要十几秒，请耐心等待。</div>');

        const prompt = `
作为数据生成器，阅读角色设定并生成该角色手机中的隐私内容。严格输出JSON格式，不要任何其他文本。
角色名字: ${char.name}
角色设定: ${persona}
生成JSON格式如下：
{
  "wechat": [{"name": "NPC名字", "msg": "聊天记录", "time": "10:30"}],
  "bank": {"balance": "余额数字", "transactions": [{"desc": "消费描述", "amount": "-金额"}]},
  "notes": [{"content": "备忘录内容", "date": "日期"}]
}`;

        try {
            console.log("[Char Phone] 开始请求模型...");
            const result = await generateRaw(prompt, true); 
            const jsonStr = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);
            renderPhoneData(data);
            alert("手机数据同步成功！");
        } catch(e) {
            console.error("生成失败", e);
            $('#wechat-list').html('<div style="color:red; padding:20px;">数据生成失败，可能是模型不支持输出纯JSON。</div>');
        }
    };

    function renderPhoneData(data) {
        if(data.wechat) {
            $('#wechat-list').html(data.wechat.map(chat => `
                <div class="wechat-msg">
                    <div class="wechat-avatar" style="background:#ddd; border-radius:8px;"></div>
                    <div class="wechat-info">
                        <div class="wechat-name">${chat.name} <span style="float:right; font-size:12px; color:#ccc">${chat.time}</span></div>
                        <div class="wechat-text">${chat.msg}</div>
                    </div>
                </div>
            `).join(''));
        }
        if(data.bank) {
            $('#bank-balance').text(data.bank.balance);
            $('#bank-list').html(data.bank.transactions.map(t => `
                <div class="bank-row">
                    <div>${t.desc}<div style="font-size:12px; color:#555; margin-top:4px">交易成功</div></div>
                    <div style="color:${t.amount.includes('-') ? '#fff' : '#D4AF37'}; font-size:16px">${t.amount}</div>
                </div>
            `).join(''));
        }
        if(data.notes) {
            $('#notes-list').html(data.notes.map(note => `
                <div class="note-item">${note.content}<div class="note-time">${note.date}</div></div>
            `).join(''));
        }
    }

    // 初始化图标
    const icons = {
        wechat: "https://raw.githubusercontent.com/yan022715/iPhoneURL/main/C5E580CF-B57B-4771-BFD7-4DB914305109.png",
        bank: "https://raw.githubusercontent.com/yan022715/iPhoneURL/main/63EDF9D3-932C-4516-B1AE-D49C5568BEFC.png",
        notes: "https://raw.githubusercontent.com/yan022715/iPhoneURL/main/4FA0C4B7-DC12-41C3-B7EA-DB9754528BF6.png",
        settings: "https://raw.githubusercontent.com/yan022715/iPhoneURL/main/63C18191-2970-4495-BBE9-15F0BD83E81D.png"
    };
    
    $('#main-grid').html(`
        <div class="app-item" onclick="openApp('settings')"><div class="app-icon" style="background-image:url(${icons.settings})"></div><span class="app-name">系统工具</span></div>
        <div class="app-item" onclick="openApp('notes')"><div class="app-icon" style="background-image:url(${icons.notes})"></div><span class="app-name">备忘录</span></div>
        <div class="app-item" onclick="openApp('bank')"><div class="app-icon" style="background-image:url(${icons.bank})"></div><span class="app-name">工商银行</span></div>
    `);
    $('#dock-grid').html(`
        <div class="app-item" onclick="openApp('wechat')"><div class="app-icon" style="background-image:url(${icons.wechat})"></div></div>
    `);
});
