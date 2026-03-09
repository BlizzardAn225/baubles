// ==UserScript==
// @name 透明头像上传
// @namespace http://tampermonkey.net/
// @version 1.2
// @description 替换 image/jpeg 为 image/png/webp/avif，并防止绘图时覆盖透明背景。仅在URL包含 account/profile/myaccount 时启用。
// @author 待我-代我-带我
// @match *://*/*
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    let enabled = false;

    // 支持的透明格式
    const TRANSPARENT_FORMATS = ['image/png', 'image/webp', 'image/avif'];
    const DEFAULT_FORMAT = 'image/png';

    // 根据原始类型决定目标格式（jpeg -> png，其他不透明格式 -> png）
    function getTransparentFormat(type) {
        if (typeof type === 'string' && TRANSPARENT_FORMATS.includes(type.toLowerCase())) {
            return type.toLowerCase(); // 已是透明格式，不修改
        }
        return DEFAULT_FORMAT; // jpeg 或其他不支持透明的格式，转为 png
    }

    function isOpaqueFormat(type) {
        if (typeof type !== 'string') return true;
        return !TRANSPARENT_FORMATS.includes(type.toLowerCase());
    }

    function shouldEnable() {
        const url = location.href.toLowerCase();
        return url.includes("account") || url.includes("profile") || url.includes("myaccount");
    }

    function enableScript() {
        if (enabled) return;
        enabled = true;
        console.log("[Tampermonkey] 透明头像脚本已启用");

        // ===== 拦截 toDataURL =====
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
            if (isOpaqueFormat(type)) {
                const target = getTransparentFormat(type);
                console.log(`[Tampermonkey] 拦截到 toDataURL("${type}")，强制改为 "${target}"`);
                return originalToDataURL.call(this, target, quality);
            }
            return originalToDataURL.call(this, type, quality);
        };

        // ===== 拦截 toBlob =====
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
            if (isOpaqueFormat(type)) {
                const target = getTransparentFormat(type);
                console.log(`[Tampermonkey] 拦截到 toBlob("${type}")，强制改为 "${target}"`);
                return originalToBlob.call(this, callback, target, quality);
            }
            return originalToBlob.call(this, callback, type, quality);
        };

        // ===== 拦截 fillStyle / fillRect 防止白底/黑底覆盖透明通道 =====
        const originalFillStyleDescriptor = Object.getOwnPropertyDescriptor(
            CanvasRenderingContext2D.prototype,
            'fillStyle'
        );
        const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;

        let isInterceptingFill = false;

        Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillStyle', {
            set(value) {
                const opaqueColors = [
                    '#ffffff', '#fff', 'white',
                    '#000000', '#000', 'black'
                ];
                if (typeof value === 'string' && opaqueColors.includes(value.toLowerCase())) {
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

        CanvasRenderingContext2D.prototype.fillRect = function (...args) {
            if (isInterceptingFill) {
                console.log('[Tampermonkey] 拦截 fillRect 绘制操作（防止覆盖透明通道）');
                return;
            }
            return originalFillRect.call(this, ...args);
        };

        // ===== 拦截 File 构造函数，伪装上传类型 =====
        const originalFileCtor = window.File;
        window.File = new Proxy(originalFileCtor, {
            construct(target, args) {
                if (args[2] && isOpaqueFormat(args[2].type)) {
                    const original = args[2].type;
                    const targetType = getTransparentFormat(original);
                    console.log(`[Tampermonkey] File 类型 "${original}" 伪装为 "${targetType}"`);
                    args[2] = Object.assign({}, args[2], { type: targetType });
                }
                return new target(...args);
            }
        });

        // ===== 拦截 Blob 构造函数，伪装上传类型 =====
        const originalBlobCtor = window.Blob;
        window.Blob = new Proxy(originalBlobCtor, {
            construct(target, args) {
                if (args[1] && isOpaqueFormat(args[1].type)) {
                    const original = args[1].type;
                    const targetType = getTransparentFormat(original);
                    console.log(`[Tampermonkey] Blob 类型 "${original}" 伪装为 "${targetType}"`);
                    args[1] = Object.assign({}, args[1], { type: targetType });
                }
                return new target(...args);
            }
        });

        // ===== 拦截 FormData.append，替换图片 Blob/File 类型 =====
        const originalAppend = FormData.prototype.append;
        FormData.prototype.append = function (name, value, filename) {
            if ((value instanceof Blob || value instanceof File) && isOpaqueFormat(value.type)) {
                const targetType = getTransparentFormat(value.type);
                console.log(`[Tampermonkey] FormData.append 拦截，类型 "${value.type}" 伪装为 "${targetType}"`);
                const newBlob = value.slice(0, value.size, targetType);
                return filename !== undefined
                    ? originalAppend.call(this, name, newBlob, filename)
                    : originalAppend.call(this, name, newBlob);
            }
            return filename !== undefined
                ? originalAppend.call(this, name, value, filename)
                : originalAppend.call(this, name, value);
        };
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
    history.pushState = function () {
        pushState.apply(this, arguments);
        setTimeout(checkURL, 50);
    };

    const replaceState = history.replaceState;
    history.replaceState = function () {
        replaceState.apply(this, arguments);
        setTimeout(checkURL, 50);
    };

    window.addEventListener('popstate', checkURL);
})();
