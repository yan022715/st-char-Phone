// 引用酒馆核心 API
import { getContext } from "../../../extensions.js";

(function() {
    // 1. 创建悬浮开关图标
    function createTrigger() {
        if ($('#phone-icon-trigger').length) return; // 防止重复创建

        const trigger = $('<div id="phone-icon-trigger" title="查看Char手机">🍎</div>');
        $('body').append(trigger);

        trigger.on('click', function() {
            $('#st-char-phone-wrapper').fadeToggle(200); // 点击切换手机显示/隐藏
        });
    }

    // 2. 加载手机 HTML 模板
    async function loadTemplate() {
        const response = await fetch('/scripts/extensions/st-char-phone/index.html');
        const html = await response.text();
        $('body').append(html);
        
        // 初始化手机内部的时间和图标
        updateTime();
        setInterval(updateTime, 1000);
    }

    function updateTime() {
        const now = new Date();
        const t = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        $('#time, #lock-time').text(t);
    }

    // 3. 等待酒馆准备就绪后再启动
    function init() {
        console.log("Char Phone Simulator: 启动中...");
        createTrigger();
        loadTemplate();
    }

    // 模仿 yexiaoxiaoye 的启动监听
    $(document).ready(function() {
        init();
    });

    // 全局函数给 HTML 调用
    window.unlockPhone = function() {
        $('#lock-screen').slideUp(400);
    };

    window.closePhoneApp = function() {
        $('.window').removeClass('open').hide();
    };

})();
