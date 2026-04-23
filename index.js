(function () {
    "use strict";

    // 1. 获取酒馆上下文的工具函数 (复刻开源仓库的获取逻辑)
    const getSTContext = () => {
        if (window.SillyTavern && window.SillyTavern.getContext) {
            return window.SillyTavern.getContext();
        }
        return null;
    };

    // 2. 这里的 UI 代码采用了“字符串注入”法，防止路径读取失败
    const phoneCSS = `
        #st-phone-fab {
            position: fixed; bottom: 100px; right: 25px; z-index: 20001;
            width: 60px; height: 60px; background: #fff; border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            font-size: 32px; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid #000; user-select: none; touch-action: none;
        }
        #st-phone-fab:active { transform: scale(0.9); }
        
        #phone-wrapper {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 20000; display: none; pointer-events: auto;
        }

        .iphone-frame {
            width: 380px; height: 800px; background: #000; 
            border-radius: 50px; border: 10px solid #333;
            position: relative; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }

        /* 极写实 UI - 灵动岛 */
        .dynamic-island {
            position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
            width: 110px; height: 32px; background: #000; border-radius: 20px; z-index: 100;
        }

        /* 应用图标样式 */
        .app-container {
            padding: 80px 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
            background: url('https://w.wallhaven.cc/full/85/wallhaven-85m76y.jpg') center/cover;
            height: 100%; box-sizing: border-box;
        }
        .app-icon {
            width: 55px; height: 55px; border-radius: 12px; margin: 0 auto;
            background-size: cover; cursor: pointer; transition: 0.2s;
        }
        .app-icon:hover { transform: scale(1.05); }
        .app-label { color: #fff; font-size: 11px; text-align: center; margin-top: 5px; text-shadow: 1px 1px 2px #000; }
    `;

    const phoneHTML = `
        <div id="st-phone-fab">📱</div>
        <div id="phone-wrapper">
            <div class="iphone-frame">
                <div class="dynamic-island"></div>
                <div class="app-container" id="phone-apps">
                    </div>
            </div>
        </div>
    `;

    // 3. 启动函数
    const init = () => {
        if ($("#st-phone-fab").length) return; // 防止重复注入

        // 注入样式
        $("<style>").text(phoneCSS).appendTo("head");
        // 注入 HTML 到酒馆的 Body
        $("body").append(phoneHTML);

        const $fab = $("#st-phone-fab");
        const $wrapper = $("#phone-wrapper");

        // 逻辑：点击悬浮球收放
        $fab.on("click", (e) => {
            $wrapper.fadeToggle(200);
        });

        // 逻辑：极其简易的拖拽 (学习自 mobile 仓库的 offset 逻辑)
        let isDragging = false;
        $fab.on("mousedown touchstart", (e) => { isDragging = true; });
        $(document).on("mousemove touchmove", (e) => {
            if (!isDragging) return;
            const event = e.type === "touchmove" ? e.touches[0] : e;
            $fab.css({
                left: event.clientX - 30 + "px",
                top: event.clientY - 30 + "px",
                bottom: "auto", right: "auto"
            });
        });
        $(document).on("mouseup touchend", () => { isDragging = false; });

        // 动态加载图标 (此处可根据需要增加更多 APP)
        const apps = [
            { name: "微信", img: "https://img.icons8.com/color/512/weixing.png" },
            { name: "相册", img: "https://img.icons8.com/fluency/512/photos.png" },
            { name: "记事本", img: "https://img.icons8.com/color/512/apple-notes.png" },
            { name: "钱包", img: "https://img.icons8.com/color/512/wallet.png" }
        ];

        apps.forEach(app => {
            $("#phone-apps").append(`
                <div class="app-item">
                    <div class="app-icon" style="background-image: url('${app.img}')"></div>
                    <div class="app-label">${app.name}</div>
                </div>
            `);
        });
        
        console.log("📱 Char Phone 插件加载成功！");
    };

    // 4. 关键：模仿开源仓库，确保护管环境准备好后再执行
    if (document.readyState === "complete") {
        init();
    } else {
        $(window).on("load", init);
    }

})();
