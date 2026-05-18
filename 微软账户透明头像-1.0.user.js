// ==UserScript==
// @name         微软账户透明头像
// @namespace    https://github.com/BlizzardAn225/baubles
// @version      1.0
// @description  移除个人档案页头像的自动背景填充、画板背景色和框选圆环，使画布透明，保留原始矩形图片。
// @author       待我-代我-带我
// @match        *://account.microsoft.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ---------- 1. 禁用 Canvas fillRect（移除所有背景色填充） ----------
    CanvasRenderingContext2D.prototype.fillRect = function() {};

    // ---------- 2. 禁用 Canvas arc（阻止框选圆环） ----------
    CanvasRenderingContext2D.prototype.arc = function() {};

    // ---------- 3. 移除 Lottie CVSolidElement 的背景填充 ----------
    function disableSolidFill() {
        if (typeof window.CVSolidElement !== 'undefined' && window.CVSolidElement.prototype) {
            window.CVSolidElement.prototype.renderInnerContent = function() {};
        } else {
            setTimeout(disableSolidFill, 100);
        }
    }
    disableSolidFill();
    const intervalId = setInterval(() => {
        if (typeof window.CVSolidElement !== 'undefined') {
            clearInterval(intervalId);
            disableSolidFill();
        }
    }, 200);

    // ---------- 4. 将所有 JPEG 图片请求自动转换为 PNG ----------
    // 拦截所有 img 元素（包括 new Image()）的 src 设置，将 .jpg/.jpeg 替换为 .png
    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (originalSrcDescriptor && originalSrcDescriptor.set) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', {
            get: originalSrcDescriptor.get,
            set: function(url) {
                if (typeof url === 'string') {
                    // 只替换以 .jpg 或 .jpeg 结尾的扩展名（忽略大小写），保留查询参数和哈希
                    url = url.replace(/\.(jpe?g)(\?|#|$)/i, '.png$2');
                }
                originalSrcDescriptor.set.call(this, url);
            },
            configurable: true,
            enumerable: true
        });
    }

})();