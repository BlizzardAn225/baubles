// ==UserScript==
// @name         透明头像上传
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  替换image/jpeg为image/png，并防止绘图时覆盖透明背景。仅在URL包含 account/profile/myaccount 时启用。
// @author       待我-代我-带我
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let enabled = false;
    function shouldEnable() {
        const url = location.href.toLowerCase();
        return url.includes("account") ||
               url.includes("profile") ||
               url.includes("myaccount");
    }
    function enableScript() {
        if (enabled) return;
        enabled = true;
        console.log("[Tampermonkey] 透明头像脚本已启用");

        // 拦截 toDataURL 的 image/jpeg
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

        HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
            if (type === 'image/jpeg') {
                console.log('[Tampermonkey] 拦截到 toDataURL("image/jpeg")，强制改为 "image/png"');
                return originalToDataURL.call(this, 'image/png', quality);

            }
            return originalToDataURL.call(this, type, quality);

        };

        // 拦截 fillStyle 和 fillRect
        const originalFillStyleDescriptor = Object.getOwnPropertyDescriptor(
            CanvasRenderingContext2D.prototype,
            'fillStyle'
        );

        const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
        let isInterceptingFill = false;

        Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillStyle', {
            set(value) {
                const whiteOrBlack = [
                    '#ffffff', '#fff', 'white',
                    '#000000', '#000', 'black'
                ];
                if (typeof value === 'string' &&
                    whiteOrBlack.includes(value.toLowerCase())) {
                    console.log(`[Tampermonkey] 拦截 fillStyle 设置为 ${value}`);
                    isInterceptingFill = true;
                } else {
                    isInterceptingFill = false;
                    originalFillStyleDescriptor.set.call(this, value);
                }

            },

            get() {
                return originalFillStyleDescriptor.get.call(this);
            },

            configurable: true,
            enumerable: true
        });

        CanvasRenderingContext2D.prototype.fillRect = function(...args) {
            if (isInterceptingFill) {
                console.log('[Tampermonkey] 拦截 fillRect 绘制操作');
                return;
            }

            return originalFillRect.call(this, ...args);

        };

        // 上传图片文件时伪装类型
        const originalFileCtor = window.File;

        window.File = new Proxy(originalFileCtor, {
            construct(target, args) {
                if (args[2] && args[2].type === 'image/jpeg') {
                    console.log('[Tampermonkey] JPEG 伪装为 PNG');
                    args[2].type = 'image/png';
                }

                return new target(...args);

            }

        });

    }

    function checkURL() {
        if (shouldEnable()) {
            enableScript();
        }
    }

    // 初始检测
    checkURL();

    // ===== SPA URL 变化监听 =====

    const pushState = history.pushState;
    history.pushState = function() {
        pushState.apply(this, arguments);
        setTimeout(checkURL, 50);
    };

    const replaceState = history.replaceState;
    history.replaceState = function() {
        replaceState.apply(this, arguments);
        setTimeout(checkURL, 50);

    };

    window.addEventListener('popstate', checkURL);

})();