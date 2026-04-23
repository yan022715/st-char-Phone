import { 
    registerExtension, 
    getContext, 
    extension_settings 
} from "../../../extensions.js";
import { generateRaw } from "../../../llm.js";

const extensionName = "ios-char-phone";
const extensionFolderPath = `scripts/extensions/${extensionName}`;

// 初始配置
const defaultSettings = {
    passcode: "0000",
    lastGeneratedChar: null
};

/**
 * 核心：向酒馆注册插件
 */
function init() {
    console.log("iOS Char Phone: Initializing...");
    
    // 1. 注入 CSS 样式表
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = `${extensionFolderPath}/style.css`;
    document.head.appendChild(styleLink);

    // 2. 加载 HTML 模板并挂载
    fetch(`${extensionFolderPath}/index.html`)
        .then(res => res.text())
        .then(html => {
            const container = document.createElement('div');
            container.id = 'st-ios-phone-root';
            container.innerHTML = html;
            document.body.appendChild(container);
            bindEvents(); // 绑定 UI 交互
        });

    // 3. 在酒馆顶栏添加启动按钮
    const topBarButton = $(`
        <div id="ios-phone-trigger" class="menu_button fa-solid fa-mobile-screen-button" title="查看角色手机"></div>
    `);
    $('#extensions_menu').append(topBarButton);
    topBarButton.on('click', togglePhone);
}

// 切换显示/隐藏
function togglePhone() {
    const $wrapper = $('#st-char-phone-wrapper');
    $wrapper.toggle();
}

// 绑定手机内部的点击事件
function bindEvents() {
    // 锁屏逻辑、App点击、Home条逻辑
    $(document).on('click', '.num-key', function() {
        const val = $(this).text();
        // ... 处理密码输入 ...
    });
    
    // 具体的 App 打开关闭逻辑等
    window.openApp = (id) => { /* 之前写的逻辑 */ };
}

// 调用 AI 获取 JSON 数据
async function fetchCharPhoneData() {
    const context = getContext();
    const char = context.characters[context.characterId];
    if (!char) return;

    // 这里是参考 yexiaoxiaoye/mobile 的核心：获取当前上下文
    const prompt = `[SYSTEM] 输出严格的 JSON 格式...（此处同前一个方案，略）`;
    const result = await generateRaw(prompt, true);
    // ... 解析并渲染 ...
}

// 导出注册函数给酒馆
registerExtension({
    name: extensionName,
    init: init
});
