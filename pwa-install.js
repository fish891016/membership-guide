/*
 * THE DRAGON CIRCLE — PWA install prompt
 *
 * Renders a top "Install App" banner and (for iOS Safari) a guided
 * "Add to Home Screen" modal. Cooperates with browsers that support
 * `beforeinstallprompt` (Chrome / Edge / Android Chrome) by deferring
 * and re-emitting the native prompt.
 *
 * Behavior:
 *   - Hidden when already running in standalone PWA mode
 *   - Hidden for ~14 days after the user dismisses (✕)
 *   - Auto-shown after disclaimer/loader closes (or ~1.5s on hsbc page)
 */

(function () {
    'use strict';

    // ───────────────────────────────────────────────────────────────────────
    // 總開關：是否對訪客顯示「安裝 App」提示 banner / iOS 引導 modal
    //   false = 完全隱藏（檔案、樣式、監聽器仍保留，方便日後即時開回）
    //   true  = 啟用（依 standalone / 冷卻 / 平台判斷顯示）
    // 想重新啟用：改成 true 即可，無需動其他檔案
    // ───────────────────────────────────────────────────────────────────────
    var PROMPT_ENABLED = false;

    var STORAGE_KEY = 'tdc_pwa_install_dismissed_at';
    var COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

    function isStandalone() {
        try {
            return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                || window.navigator.standalone === true
                || (document.referrer || '').indexOf('android-app://') === 0;
        } catch (e) {
            return false;
        }
    }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !window.MSStream;
    }

    function isIOSSafari() {
        var ua = navigator.userAgent || '';
        return isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
    }

    function isInAppBrowser() {
        var ua = navigator.userAgent || '';
        return /(FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|KAKAOTALK)/i.test(ua);
    }

    function dismissedRecently() {
        try {
            var ts = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            return ts > 0 && (Date.now() - ts) < COOLDOWN_MS;
        } catch (e) {
            return false;
        }
    }

    function markDismissed() {
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) {}
    }

    function clearDismissed() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }

    function canShow() {
        if (isStandalone()) return false;
        if (dismissedRecently()) return false;
        return true;
    }

    function buildBanner() {
        var banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', '安裝 App 提示');
        banner.innerHTML = ''
            + '<button class="pwa-install-banner__close" type="button" aria-label="關閉提示">'
            +     '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            +         '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
            +     '</svg>'
            + '</button>'
            + '<div class="pwa-install-banner__icon" aria-hidden="true">'
            +     '<img src="/icon-192.png" alt="" loading="lazy" decoding="async">'
            + '</div>'
            + '<div class="pwa-install-banner__text">'
            +     '<div class="pwa-install-banner__title">環哩匯 The Dragon Circle</div>'
            +     '<div class="pwa-install-banner__desc">安裝 App 以便快速存取</div>'
            + '</div>'
            + '<button class="pwa-install-banner__cta" type="button">安裝</button>';
        return banner;
    }

    function buildModal() {
        var modal = document.createElement('div');
        modal.className = 'pwa-install-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'pwaInstallModalTitle');
        modal.innerHTML = ''
            + '<div class="pwa-install-modal__sheet" role="document">'
            +     '<button class="pwa-install-modal__close" type="button" aria-label="關閉">'
            +         '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            +             '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
            +         '</svg>'
            +     '</button>'
            +     '<div class="pwa-install-modal__header">安裝 App</div>'
            +     '<h2 class="pwa-install-modal__title" id="pwaInstallModalTitle">如何將 App 加入主畫面？</h2>'
            +     '<ol class="pwa-install-modal__steps">'
            +         '<li class="pwa-install-modal__step">'
            +             '<div class="pwa-install-modal__icon" aria-hidden="true">'
            +                 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
            +                     '<path d="M12 4v12"/>'
            +                     '<path d="M7 9l5-5 5 5"/>'
            +                     '<path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'
            +                 '</svg>'
            +             '</div>'
            +             '<p>開啟 <strong>瀏覽器選單</strong>，再點選 <strong>分享</strong> 按鈕</p>'
            +         '</li>'
            +         '<li class="pwa-install-modal__step">'
            +             '<div class="pwa-install-modal__icon" aria-hidden="true">'
            +                 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
            +                     '<rect x="4" y="4" width="16" height="16" rx="3"/>'
            +                     '<path d="M12 8v8"/>'
            +                     '<path d="M8 12h8"/>'
            +                 '</svg>'
            +             '</div>'
            +             '<p>選擇 <strong>「加入主畫面」</strong>，即可完成安裝</p>'
            +         '</li>'
            +         '<li class="pwa-install-modal__step">'
            +             '<div class="pwa-install-modal__icon" aria-hidden="true">'
            +                 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
            +                     '<path d="M5 12l4 4 10-10"/>'
            +                 '</svg>'
            +             '</div>'
            +             '<p>從主畫面點圖示 <strong>啟動 APP</strong>，享受全螢幕專屬體驗</p>'
            +         '</li>'
            +     '</ol>'
            +     '<button class="pwa-install-modal__ok" type="button">我知道了</button>'
            + '</div>';
        return modal;
    }

    function waitForOverlayHidden() {
        return new Promise(function (resolve) {
            var overlay = document.getElementById('disclaimerOverlay');
            var loader = document.getElementById('loader');

            function isHidden(el) {
                if (!el) return true;
                if (el.hidden) return true;
                var s = window.getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden') return true;
                if (el.classList.contains('hidden')) return true;
                return false;
            }

            function check() {
                if (isHidden(overlay) && isHidden(loader)) {
                    resolve();
                    return true;
                }
                return false;
            }

            if (check()) return;

            var observer = new MutationObserver(function () {
                if (check()) observer.disconnect();
            });
            if (overlay) observer.observe(overlay, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
            if (loader) observer.observe(loader, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });

            setTimeout(function () { observer.disconnect(); resolve(); }, 60000);
        });
    }

    function init() {
        if (!PROMPT_ENABLED) return;
        if (!canShow()) return;
        if (isInAppBrowser()) return;

        var banner = buildBanner();
        var modal = buildModal();
        document.body.appendChild(banner);
        document.body.appendChild(modal);

        var deferredPrompt = null;

        function showBanner() {
            if (!canShow()) return;
            requestAnimationFrame(function () {
                banner.classList.add('is-visible');
                document.documentElement.classList.add('pwa-install-banner-visible');
            });
        }

        function hideBanner() {
            banner.classList.remove('is-visible');
            document.documentElement.classList.remove('pwa-install-banner-visible');
        }

        function openModal() {
            modal.classList.add('is-visible');
            document.documentElement.classList.add('pwa-install-modal-open');
        }

        function closeModal() {
            modal.classList.remove('is-visible');
            document.documentElement.classList.remove('pwa-install-modal-open');
        }

        banner.querySelector('.pwa-install-banner__close').addEventListener('click', function () {
            hideBanner();
            markDismissed();
        });

        banner.querySelector('.pwa-install-banner__cta').addEventListener('click', function () {
            if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
                try {
                    deferredPrompt.prompt();
                    var choice = deferredPrompt.userChoice;
                    if (choice && typeof choice.then === 'function') {
                        choice.then(function (result) {
                            deferredPrompt = null;
                            if (result && result.outcome === 'accepted') {
                                hideBanner();
                                clearDismissed();
                            }
                        });
                    }
                } catch (e) {
                    openModal();
                }
            } else {
                openModal();
            }
        });

        modal.querySelector('.pwa-install-modal__close').addEventListener('click', closeModal);
        modal.querySelector('.pwa-install-modal__ok').addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-visible')) {
                closeModal();
            }
        });

        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            deferredPrompt = e;
            showBanner();
        });

        window.addEventListener('appinstalled', function () {
            hideBanner();
            clearDismissed();
        });

        waitForOverlayHidden().then(function () {
            if (!deferredPrompt) {
                if (isIOSSafari() || isIOS()) {
                    setTimeout(showBanner, 600);
                } else if (!('onbeforeinstallprompt' in window)) {
                    setTimeout(showBanner, 1200);
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
