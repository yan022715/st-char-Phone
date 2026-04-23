import { getContext } from '../../../../scripts/extensions.js';
import { generateRaw } from '../../../../scripts/llm.js';

// =========================================================================
// 终极杀招：把所有 HTML 和 CSS 封装在 JS 字符串里，无视任何路径和加载错误！
// =========================================================================
const phoneUIString = `
<style>
    /* 强力隔离样式，绝对不影响酒馆本身 */
    #st-char-phone-container {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 999999; display: none; /* 初始隐藏，靠悬浮球打开 */
        font-family: -apple-system, "SF Pro Display", sans-serif;
        user-select: none;
    }
    
    /* 悬浮球 (极简玻璃拟物风) */
    #char-phone-fab {
        position: fixed; bottom: 30px; right: 30px; z-index: 999998;
        width: 56px; height: 56px; border-radius: 28px;
        background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.5);
        display: flex; justify-content: center; align-items: center;
        font-size: 28px; cursor: pointer; transition: 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #char-phone-fab:hover { transform: scale(1.1); }
    #char-phone-fab:active { transform: scale(0.9); }

    /* 手机物理外壳 */
    #st-char-phone-container .iphone-body {
        width: 390px; height: 844px;
        background: #000; border-radius: 55px; border: 12px solid #2c2c2e;
        position: relative; overflow: hidden;
        box-shadow: 0 0 0 2px #111, 0 30px 60px rgba(0,0,0,0.8);
        transform-origin: center;
    }
    
    /* 响应式缩放：酒馆在手机/小屏幕上自动缩小手机，不挡视线 */
    @media screen and (max-height: 900px) { #st-char-phone-container .iphone-body { transform: scale(0.8); } }
    @media screen and (max-height: 750px) { #st-char-phone-container .iphone-body { transform: scale(0.65); } }
    @media screen and (max-width: 500px) { #st-char-phone-container .iphone-body { transform: scale(0.7); } }

    /* 拖拽手柄区 (透明层盖在刘海上) */
    .drag-handle-area { position: absolute; top: 0; left: 0; width: 100%; height: 50px; z-index: 100000; cursor: grab; }
    .drag-handle-area:active { cursor: grabbing; }

    /* 系统组件 */
    .dynamic-island { position: absolute; top: 11px; left: 50%; transform: translateX(-50%); width: 120px; height: 35px; background: #000; border-radius: 20px; z-index: 10000; pointer-events: none; }
    .status-bar { position: absolute; top: 0; width: 100%; height: 44px; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; z-index: 9000; color: #fff; font-size: 15px; font-weight: 600; pointer-events: none; box-sizing: border-box;}
    .home-indicator { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 135px; height: 5px; background: #000; border-radius: 10px; z-index: 8000; cursor: pointer; }

    /* 层级和背景 */
    .phone-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; box-sizing: border-box; }
    
    /* 密码解锁UI */
    #phone-passcode { display: none; z-index: 1500; background: rgba(0,0,0,0.5); backdrop-filter: blur(25px); flex-direction: column; align-items: center; color: white;}
    .passcode-dots { display: flex; gap: 20px; margin: 30px 0 60px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid white; }
    .dot.filled { background: white; }
    .numpad { display: grid; grid-template-columns: repeat(3, 75px); gap: 15px 25px; }
    .num-key { width: 75px; height: 75px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: 300; cursor: pointer; }
    
    /* 桌面UI */
    #phone-desktop { display: none; z-index: 500; background-image: url('https://i.ibb.co/JgtLShX/128-D5939-E059-417-A-B3-A5-59-AB6-B4-A443-C.jpg'); }
    .app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 15px; padding: 100px 20px; }
    .app-icon { width: 60px; height: 60px; border-radius: 14px; background-size: cover; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.15); margin: 0 auto 5px;}
    .app-label { color: white; font-size: 11px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.6); }
    .dock { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 350px; height: 90px; background: rgba(255,255,255,0.3); backdrop-filter: blur(20px); border-radius: 30px; display: flex; justify-content: space-evenly; align-items: center; }

    /* App 窗口基础 */
    .app-window { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2000; background: #fff; display: none; flex-direction: column; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .app-window.open { transform: translateY(0); }

    /* 写实化 APP 样式 */
    .wx-header { height: 88px; background: #ededed; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 15px; font-weight: 500; border-bottom: 1px solid #ddd; }
    .wx-msg { display: flex; padding: 15px; border-bottom: 1px solid #f1f1f1; }
    .wx-msg-text { font-size: 14px; color: #999; margin-top: 4px; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;}
    
    .bank-ui { background: #111; color: #d4af37; }
    .bank-header { height: 88px; display: flex; align-items: flex-end; padding: 0 20px 15px; font-size: 24px; font-weight: 600; border-bottom: 1px solid #333; }
    .bank-card { margin: 20px; border-radius: 12px; background: linear-gradient(135deg, #333, #000); padding: 20px; border: 1px solid #444; }
    
    .sync-btn { background: #007aff; color: white; border: none; padding: 15px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; width: 90%; margin: 20px auto; display: block; }
</style>

<div id="char-phone-fab">📱</div>

<div id="st-char-phone-container">
    <div class="iphone-body">
        <div class="drag-handle-area"></div>
        <div class="dynamic-island"></div>
        <div class="status-bar" id="phone-status-bar">
            <div>09:41</div>
            <div style="font-size:12px; display:flex; gap:5px; align-items:center;">5G <div style="width:22px; height:11px; border:1px solid #fff; border-radius:3px; position:relative;"><div style="background:#fff; width:80%; height:100%;"></div></div></div>
        </div>

        <div id="phone-lockscreen" class="phone-layer" style="background-image: url('https://i.ibb.co/JgtLShX/128-D5939-E059-417-A-B3-A5-59-AB6-B4-A443-C.jpg'); text-align:center; color:white;">
            <div style="margin-top: 120px; font-size: 80px; font-weight: 200;">09:41</div>
            <div style="margin-top: 10px; font-size: 20px;">向上轻扫以解锁</div>
            <div class="home-indicator" style="background:#fff;"></div>
        </div>

        <div id="phone-passcode" class="phone-layer">
            <div style="margin-top:100px; font-size:20px;">输入密码 (默认0000)</div>
            <div class="passcode-dots">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
            <div class="numpad">
                <div class="num-key" data-n="1">1</div><div class="num-key" data-n="2">2</div><div class="num-key" data-n="3">3</div>
                <div class="num-key" data-n="4">4</div><div class="num-key" data-n="5">5</div><div class="num-key" data-n="6">6</div>
                <div class="num-key" data-n="7">7</div><div class="num-key" data-n="8">8</div><div class="num-key" data-n="9">9</div>
                <div></div><div class="num-key" data-n="0">0</div><div id="pass-cancel" style="display:flex; justify-content:center; align-items:center; cursor:pointer;">取消</div>
            </div>
        </div>

        <div id="phone-desktop" class="phone-layer">
            <div class="app-grid">
                <div><div class="app-icon" id="open-settings" style="background-image:url('https://raw.githubusercontent.com/yan022715/iPhoneURL/main/63C18191-2970-4495-BBE9-15F0BD83E81D.png')"></div><div class="app-label">系统同步</div></div>
                <div><div class="app-icon" id="open-notes" style="background-image:url('https://raw.githubusercontent.com/yan022715/iPhoneURL/main/4FA0C4B7-DC12-41C3-B7EA-DB9754528BF6.png')"></div><div class="app-label">备忘录</div></div>
                <div><div class="app-icon" id="open-bank" style="background-image:url('https://raw.githubusercontent.com/yan022715/iPhoneURL/main/63EDF9D3-932C-4516-B1AE-D49C5568BEFC.png')"></div><div class="app-label">工商银行</div></div>
            </div>
            <div class="dock">
                <div class="app-icon" id="open-wechat" style="background-image:url('https://raw.githubusercontent.com/yan022715/iPhoneURL/main/C5E580CF-B57B-4771-BFD7-4DB914305109.png'); margin:0;"></div>
            </div>
        </div>

        <div id="app-wechat" class="app-window" style="background:#fff;">
            <div class="wx-header">微信</div>
            <div id="wx-content" style="flex:1; overflow-y:auto; color:#000;">
                <div style="padding:20px; text-align:center; color:#999;">请先进入"系统同步"获取角色数据</div>
            </div>
            <div class="home-indicator go-home" style="background:#000;"></div>
        </div>

        <div id="app-bank" class="app-window bank-ui">
            <div class="bank-header">工商银行</div>
            <div class="bank-card">
                <div style="font-size:12px; opacity:0.8;">私人财富卡</div>
                <div style="margin-top:20px; font-size:14px; color:#999;">可用余额 (元)</div>
                <div id="bank-balance" style="font-size:32px; font-weight:600; margin-top:5px; font-family:monospace;">***</div>
            </div>
            <div id="bank-content" style="flex:1; overflow-y:auto; padding:0 20px;"></div>
            <div class="home-indicator go-home" style="background:#fff;"></div>
        </div>

        <div id="app-settings" class="app-window" style="background:#f2f2f7;">
            <div class="wx-header" style="background:#f2f2f7; border:none;">数据同步</div>
            <div style="flex:1;">
                <p style="padding:20px; color:#666; font-size:14px; text-align:center;">此功能将读取当前酒馆角色卡(Persona)设定，利用当前API接口自动生成符合身份的手机内容。</p>
                <button class="sync-btn" id="btn-sync-data">一键骇入角色手机数据</button>
                <div id="sync-status" style="text-align:center; color:#007aff; font-size:13px; margin-top:10px;"></div>
            </div>
            <div class="home-indicator go-home" style="background:#000;"></div>
        </div>
    </div>
</div>
`;

// =========================================================================
// 核心逻辑绑定 (当酒馆DOM加载完毕后强行注入)
// =========================================================================
jQuery(function () {
    // 1. 暴力注入 HTML 到 body 最末尾
    $('body').append(phoneUIString);
    console.log("[Char Phone] 界面已强制注入！");

    const container = $('#st-char-phone-container');
    const fab = $('#char-phone-fab');
    let passCode = "";

    // 2. 悬浮球开合逻辑
    fab.on('click', function() {
        if (container.css('display') === 'none') {
            container.fadeIn(250);
        } else {
            container.fadeOut(250);
        }
    });

    // 3. 完美拖拽逻辑 (完全适配鼠标和触屏)
    let isDragging = false, startX, startY, initialLeft, initialTop;
    const dragArea = document.querySelector('.drag-handle-area');
    const phoneDOM = document.getElementById('st-char-phone-container');

    function dragStart(e) {
        if(e.type === 'touchstart') e = e.touches[0];
        isDragging = true;
        // 获取当前transform计算后的实际偏移
        const rect = phoneDOM.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left + rect.width / 2;
        initialTop = rect.top + rect.height / 2;
        phoneDOM.style.transform = `translate(-50%, -50%)`; // 保持锚点居中
    }
    function dragMove(e) {
        if (!isDragging) return;
        if(e.type === 'touchmove') e = e.touches[0];
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        phoneDOM.style.left = `${initialLeft + dx}px`;
        phoneDOM.style.top = `${initialTop + dy}px`;
    }
    function dragEnd() { isDragging = false; }

    dragArea.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    dragArea.addEventListener('touchstart', dragStart, {passive: true});
    document.addEventListener('touchmove', dragMove, {passive: true});
    document.addEventListener('touchend', dragEnd);

    // 4. 锁屏与密码逻辑
    $('#phone-lockscreen').on('click', () => {
        $('#phone-lockscreen').hide();
        $('#phone-passcode').css('display', 'flex');
        passCode = ""; updateDots();
    });
    
    $('.num-key').on('click', function() {
        if(passCode.length < 4) passCode += $(this).data('n');
        updateDots();
        if(passCode.length === 4) {
            if(passCode === "0000") {
                $('#phone-passcode').hide();
                $('#phone-desktop').show();
            } else {
                alert("密码错误(默认0000)");
                passCode = ""; updateDots();
            }
        }
    });
    
    $('#pass-cancel').on('click', () => {
        $('#phone-passcode').hide();
        $('#phone-lockscreen').show();
    });

    function updateDots() {
        $('.dot').each((i, el) => { $(el).toggleClass('filled', i < passCode.length); });
    }

    // 5. App 开启与返回桌面
    const openApp = (appId, darkStatus = true) => {
        $(`#app-${appId}`).css('display', 'flex').delay(10).queue(function(next){ $(this).addClass('open'); next(); });
        $('#phone-status-bar').css('color', darkStatus ? '#000' : '#fff');
    };

    $('#open-settings').click(() => openApp('settings'));
    $('#open-wechat').click(() => openApp('wechat'));
    $('#open-bank').click(() => openApp('bank', false)); // 银行是黑底，状态栏保持白色

    $('.go-home').on('click', function() {
        $('.app-window.open').removeClass('open').delay(300).queue(function(next){ $(this).hide(); next(); });
        $('#phone-status-bar').css('color', '#fff'); // 回桌面状态栏变白
    });

    // =========================================================================
    // 6. 核心：通过酒馆原生接口读取人物数据并生成手机内容
    // =========================================================================
    $('#btn-sync-data').on('click', async function() {
        const context = getContext();
        const charId = context.characterId;
        if(charId === undefined) return alert("老妹儿，你得先在酒馆里点开一个
