// ==UserScript==
// @name         透明头像上传
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  替换image/jpeg为image/png，并防止绘图时覆盖透明背景。只适用于前端操作的，后端参与修改的无法实现，例如微博、百度。已测试的有：B站、小米账号、微软个人档案、谷歌，其他待补充。
// @author       待我-代我-带我
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    //拦截 toDataURL 的 image/jpeg
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        if (type === 'image/jpeg') {
            console.log('[Tampermonkey] 拦截到 toDataURL("image/jpeg")，强制改为 "image/png"');
            return originalToDataURL.call(this, 'image/png', quality);
        }
        return originalToDataURL.call(this, type, quality);
    };

    //拦截 fillStyle 和 fillRect
    const originalFillStyleDescriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');
    const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;

    let isInterceptingFill = false;

    Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillStyle', {
        set(value) {
            const whiteOrBlack = ['#ffffff', '#fff', 'white', '#000000', '#000', 'black'];
            if (typeof value === 'string' && whiteOrBlack.includes(value.toLowerCase())) {
                console.log(`[Tampermonkey] 拦截 fillStyle 设置为 ${value}，跳过设置以保护透明背景`);
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
            console.log('[Tampermonkey] 拦截 fillRect 绘制操作，跳过透明背景覆盖');
            return; // 不执行
        }
        return originalFillRect.call(this, ...args);
    };

    // ============ 可选增强：上传图片文件时伪装类型为 image/png ============
    const originalFileCtor = window.File;
    window.File = new Proxy(originalFileCtor, {
        construct(target, args) {
            if (args[2] && args[2].type === 'image/jpeg') {
                console.log('[Tampermonkey] 拦截 File 构造函数，将 image/jpeg 改为 image/png');
                args[2].type = 'image/png';
            }
            return new target(...args);
        }
    });

})();
