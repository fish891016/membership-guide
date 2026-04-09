        function toggleHotelDetail(btn) {
            const detail = btn.nextElementSibling;
            const isOpen = detail.classList.toggle('open');
            btn.classList.toggle('active', isOpen);
            btn.textContent = isOpen ? '收合方案' : '查看方案';
        }

        function closeDisclaimer() {
            const overlay = document.getElementById('disclaimerOverlay');
            overlay.classList.remove('show');
            overlay.classList.add('hidden');
            setTimeout(function() {
                document.body.classList.add('dragon-active');
            }, 600);
            // 關閉後把焦點還給第一個主要導覽連結
            const firstNavLink = document.querySelector('header#header nav a');
            if (firstNavLink) firstNavLink.focus();
        }

        // Disclaimer modal 無障礙：ESC 關閉 + focus trap + 開啟時自動聚焦
        (function initDisclaimerA11y() {
            const overlay = document.getElementById('disclaimerOverlay');
            if (!overlay) return;

            function getFocusables() {
                return Array.from(overlay.querySelectorAll(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                ));
            }

            // 當 overlay 加上 "show" class 時自動聚焦到主按鈕
            // 使用 requestAnimationFrame 等下一 frame 再 focus，避免在 display 轉換過程中 focus 失敗
            const observer = new MutationObserver(function(mutations) {
                for (const m of mutations) {
                    if (m.attributeName === 'class' && overlay.classList.contains('show')) {
                        requestAnimationFrame(() => {
                            const btn = document.getElementById('disclaimerBtn');
                            if (btn) btn.focus();
                        });
                        break;
                    }
                }
            });
            observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });

            // ESC 關閉 + Tab focus trap
            document.addEventListener('keydown', function(e) {
                if (!overlay.classList.contains('show')) return;

                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeDisclaimer();
                    return;
                }

                if (e.key === 'Tab') {
                    const focusables = getFocusables();
                    if (focusables.length === 0) return;
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            });
        })();

        function toggleMobileNav() {
            const toggle = document.getElementById('menuToggle');
            const mobileNav = document.getElementById('mobileNav');
            if (!toggle || !mobileNav) return;
            const open = mobileNav.classList.toggle('active');
            toggle.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
            document.body.style.overflow = open ? 'hidden' : '';
        }

        function closeMobileNav() {
            const toggle = document.getElementById('menuToggle');
            const mobileNav = document.getElementById('mobileNav');
            if (!toggle || !mobileNav) return;
            toggle.classList.remove('active');
            mobileNav.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', '開啟導覽選單');
            document.body.style.overflow = '';
        }

        // ESC 鍵關閉手機導覽（disclaimer modal 有自己的 ESC 處理器，不會衝突）
        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Escape') return;
            const mobileNav = document.getElementById('mobileNav');
            if (mobileNav && mobileNav.classList.contains('active')) {
                closeMobileNav();
                const toggle = document.getElementById('menuToggle');
                if (toggle) toggle.focus();
            }
        });

        function toggleTablePin() {
            const toggle = document.getElementById('pinToggle');
            const wrapper = document.getElementById('comparisonWrapper');
            toggle.classList.toggle('active');
            wrapper.classList.toggle('pinned');
        }

        // ── Comfort Reading Mode (舒適閱讀模式) ──
        function toggleComfortMode() {
            var html = document.documentElement;
            var toggle = document.getElementById('comfortToggle');
            var isActive = html.classList.contains('comfort-mode');

            html.classList.add('comfort-transitioning');

            setTimeout(function() {
                if (isActive) {
                    html.classList.remove('comfort-mode');
                    localStorage.removeItem('comfortMode');
                    if (toggle) toggle.setAttribute('aria-pressed', 'false');
                } else {
                    html.classList.add('comfort-mode');
                    localStorage.setItem('comfortMode', 'on');
                    if (toggle) toggle.setAttribute('aria-pressed', 'true');
                }

                setTimeout(function() {
                    html.classList.remove('comfort-transitioning');
                }, 150);
            }, 150);
        }

        // Restore preference on page load
        (function restoreComfortMode() {
            if (localStorage.getItem('comfortMode') === 'on') {
                document.documentElement.classList.add('comfort-mode');
                var toggle = document.getElementById('comfortToggle');
                if (toggle) toggle.setAttribute('aria-pressed', 'true');
            }
        })();

        function createParticles() {
            const container = document.getElementById('particles');
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 15 + 's';
                particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                container.appendChild(particle);
            }
        }
        createParticles();

        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('loader').classList.add('hidden');
                document.getElementById('mainContent').classList.add('visible');
                setTimeout(() => {
                    document.getElementById('disclaimerOverlay').classList.add('show');
                }, 300);
            }, 800);
        });

        // 統一的 scroll 處理器（header 縮放 + hero parallax + back-to-top）
        // 使用 requestAnimationFrame 節流，避免每次 scroll 都觸發 reflow/repaint
        (function initScrollHandler() {
            const header = document.getElementById('header');
            const hero = document.querySelector('.hero');
            let backToTop = null; // 延遲查詢，因為可能還沒掛上 DOM
            let ticking = false;
            let lastScrolled = false;
            let lastBackToTopShown = false;

            function onScroll() {
                const scrollY = window.scrollY;

                // Header 縮放效果
                const shouldScroll = scrollY > 100;
                if (shouldScroll !== lastScrolled) {
                    header.classList.toggle('scrolled', shouldScroll);
                    lastScrolled = shouldScroll;
                }

                // Hero dragon parallax
                if (hero) {
                    const vh = window.innerHeight;
                    const shift = Math.min(scrollY / vh, 1) * 30;
                    hero.style.setProperty('--dragon-shift', shift + 'px');
                }

                // Back-to-top 按鈕顯示
                if (!backToTop) backToTop = document.getElementById('backToTop');
                if (backToTop) {
                    const shouldShow = scrollY > 500;
                    if (shouldShow !== lastBackToTopShown) {
                        backToTop.classList.toggle('show', shouldShow);
                        lastBackToTopShown = shouldShow;
                    }
                }

                ticking = false;
            }

            window.addEventListener('scroll', function() {
                if (!ticking) {
                    requestAnimationFrame(onScroll);
                    ticking = true;
                }
            }, { passive: true });
        })();

        // 滾動顯示動畫
        const fadeElements = document.querySelectorAll('.fade-in');
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        fadeElements.forEach(el => observer.observe(el));

        // 滾動到指定區塊
        function scrollToSection(id) {
            const element = document.getElementById(id);
            if (element) {
                const headerOffset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }

        // 權益面板切換
        const panelOrder = ['booking', 'linebooking', 'transfer', 'hyvip', 'hoshinoya', 'suite', 'dragon', 'calculator'];
        let currentPanelIndex = 0;
        
        function isMobileView() {
            return window.innerWidth <= 768;
        }
        
        function showBenefitPanel(panelId, e, direction) {
            const index = panelOrder.indexOf(panelId);
            if (index === -1) return;

            currentPanelIndex = index;

            document.querySelectorAll('.benefit-panel').forEach(panel => {
                panel.classList.remove('active', 'slide-left', 'slide-right');
            });

            const targetPanel = document.getElementById('panel-' + panelId);
            if (!targetPanel) return;

            targetPanel.classList.add('active');
            
            if (isMobileView() && direction) {
                targetPanel.classList.add(direction === 'left' ? 'slide-left' : 'slide-right');
            }
            
            document.querySelectorAll('.benefit-tab').forEach((tab, i) => {
                tab.classList.toggle('active', i === index);
            });
            
            if (e && e.target) {
                e.target.classList.add('active');
            }
            
            updateIndicators();
            
            if (isMobileView()) {
                const activeTab = document.querySelectorAll('.benefit-tab')[currentPanelIndex];
                if (activeTab) {
                    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }
        
        function switchToPanel(index, direction) {
            if (index < 0 || index >= panelOrder.length) return;
            const slideDirection = direction || (index > currentPanelIndex ? 'left' : 'right');
            currentPanelIndex = index;
            showBenefitPanel(panelOrder[index], null, slideDirection);
        }
        
        function updateIndicators() {
            const container = document.getElementById('panelIndicators');
            if (!container) return;
            
            if (isMobileView()) {
                if (container.children.length === 0) {
                    panelOrder.forEach((_, i) => {
                        const dot = document.createElement('div');
                        dot.className = 'panel-indicator' + (i === currentPanelIndex ? ' active' : '');
                        dot.dataset.index = i;
                        dot.addEventListener('click', function() {
                            switchToPanel(i);
                        });
                        container.appendChild(dot);
                    });
                } else {
                    container.querySelectorAll('.panel-indicator').forEach((indicator, i) => {
                        indicator.classList.toggle('active', i === currentPanelIndex);
                    });
                }
            }
        }
        
        // 權益面板滑動功能（僅手機版）
        (function initBenefitSwipe() {
            const container = document.getElementById('benefitPanelsContainer');
            if (!container) return;
            
            let startX = 0;
            let startY = 0;
            let isHorizontalSwipe = null;
            const threshold = 50;
            const directionThreshold = 10;
            
            container.addEventListener('touchstart', (e) => {
                if (!isMobileView()) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isHorizontalSwipe = null;
            }, { passive: true });
            
            container.addEventListener('touchmove', (e) => {
                if (!isMobileView()) return;
                
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = currentX - startX;
                const diffY = currentY - startY;
                
                if (isHorizontalSwipe === null && (Math.abs(diffX) > directionThreshold || Math.abs(diffY) > directionThreshold)) {
                    isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
                }
            }, { passive: true });
            
            container.addEventListener('touchend', (e) => {
                if (!isMobileView() || !isHorizontalSwipe) {
                    isHorizontalSwipe = null;
                    return;
                }
                
                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;
                
                if (diffX < -threshold && currentPanelIndex < panelOrder.length - 1) {
                    switchToPanel(currentPanelIndex + 1, 'left');
                } else if (diffX > threshold && currentPanelIndex > 0) {
                    switchToPanel(currentPanelIndex - 1, 'right');
                }
                
                isHorizontalSwipe = null;
            });
        })();

        updateIndicators();
        window.addEventListener('resize', function() {
            updateIndicators();
        });

        // FAQ 展開
        function toggleFaq(button) {
            const item = button.closest('.faq-item');
            item.classList.toggle('open');
        }

        // 複製代碼
        function copyCode(code) {
            navigator.clipboard.writeText(code).then(() => {
                const toast = document.getElementById('copyToast');
                if (toast) {
                    toast.classList.add('show');
                    setTimeout(() => { toast.classList.remove('show'); }, 2500);
                }
            }).catch(() => {});
        }

        // 機場接送表格切換
        function showTransferTable(type, e) {
            document.querySelectorAll('.transfer-table').forEach(table => {
                table.style.display = 'none';
            });
            document.getElementById('table-' + type).style.display = 'table';
            
            const comboNote = document.getElementById('combo-note');
            if (comboNote) {
                comboNote.style.display = type === 'combo' ? 'flex' : 'none';
            }
            
            document.querySelectorAll('.transfer-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            if (e && e.target) {
                e.target.classList.add('active');
            }
        }

        // 回到頂部
        function scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        // 平滑滾動到錨點
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        const tierBonusRates = {
            'ambassador': 0.75,
            'titanium': 0.75,
            'platinum': 0.50,
            'gold': 0.25,
            'silver': 0.10,
            'member': 0
        };

        const hotelData = {
            'courtyard': {
                name: '南港六福萬怡酒店',
                brand: 'COURTYARD BY MARRIOTT',
                price: 23888,
                promoTitle: '套房贈點方案',
                label: '環哩匯貴賓專屬 · 不限平日假日',
                note: '含稅及服務費 · 精緻套房（NT$23,888）',
                tiers: {
                    diamond: { promo: 80888, label: '' },
                    other: { promo: 60888, label: '' }
                },
                extraBonus: 0,
                extraBonusPeriod: '',
                benefits: ['每日免費雙人早餐', '免費停車權益', '可累積萬豪旅享家點數房晚', '可享酒廊權益']
            },
            'amnis': {
                name: '高雄然一翡世之選酒店',
                brand: 'THE AMNIS KAOHSIUNG',
                price: 23888,
                promoTitle: '住房專案',
                label: 'Junior Suite King Harbor View Room',
                note: '港景套房／城景套房 · 平假日同價',
                tiers: {
                    diamond: { promo: 88888, label: '鑽石會員' },
                    other: { promo: 68888, label: '非鑽石會員' }
                },
                extraBonus: 0,
                extraBonusPeriod: '',
                benefits: ['贈送雙人早餐', '高鐵/小港機場 ↔ 然一酒店來回禮車接駁乙次', 'Happy Hour 禮遇（不限等級）']
            },
            'other': {
                name: '其他飯店（非特案）',
                brand: 'CUSTOM HOTEL',
                price: 23888,
                promoTitle: '一般回饋估算',
                label: '可自由輸入房價與實付金額',
                note: '非特案情境預設無方案贈點，可透過「其他積分」自行補入',
                tiers: {
                    diamond: { promo: 0, label: '' },
                    other: { promo: 0, label: '' }
                },
                extraBonus: 0,
                extraBonusPeriod: '',
                benefits: ['可計算萬豪基礎積分與會籍加成', '可自訂其他積分、早餐與停車價值', '適用一般飯店或自訂情境估算'],
                customInputMode: true
            }
        };

        function updateHotelInfo() {
            const hotelSelect = document.getElementById('calcHotel');
            const selectedHotel = hotelData[hotelSelect.value];
            
            if (!selectedHotel) return;
            
            document.querySelector('.calc-hotel-bar-info .hotel-brand').textContent = selectedHotel.brand;
            document.querySelector('.calc-hotel-bar-info .hotel-name').textContent = selectedHotel.name;
            document.querySelector('.calc-hotel-bar-meta .promo-title').textContent = selectedHotel.promoTitle;
            document.querySelector('.calc-hotel-bar-meta .calc-price-label').textContent = selectedHotel.label;
            document.querySelector('.calc-hotel-bar-price .calc-price-value').innerHTML = '<span>NT$</span> ' + selectedHotel.price.toLocaleString();
            document.querySelector('.calc-hotel-bar-price .calc-price-note').textContent = selectedHotel.note;
            
            if (!selectedHotel.customInputMode) {
                document.getElementById('calcRoomPrice').value = selectedHotel.price;
                document.getElementById('calcActualPrice').value = selectedHotel.price;
            }

            const specialPlanToggle = document.getElementById('calcApplySpecialPlan');
            const specialPlanToggleWrap = document.getElementById('calcSpecialPlanToggleWrap');
            if (specialPlanToggleWrap) {
                specialPlanToggleWrap.style.display = selectedHotel.customInputMode ? 'none' : 'flex';
            }
            if (specialPlanToggle && selectedHotel.customInputMode) {
                specialPlanToggle.checked = false;
            }
            
            const tierItems = document.querySelectorAll('.calc-tier-item');
            if (tierItems[0]) {
                const diamondBadge = tierItems[0].querySelector('.calc-tier-badge');
                tierItems[0].querySelector('.calc-tier-points').innerHTML = selectedHotel.tiers.diamond.promo.toLocaleString() + ' <span>點</span>';
                diamondBadge.textContent = selectedHotel.tiers.diamond.label
                    ? '環哩匯鑽石（' + selectedHotel.tiers.diamond.label + '）'
                    : '環哩匯鑽石貴賓以上';
            }
            if (tierItems[1]) {
                const otherBadge = tierItems[1].querySelector('.calc-tier-badge');
                tierItems[1].querySelector('.calc-tier-points').innerHTML = selectedHotel.tiers.other.promo.toLocaleString() + ' <span>點</span>';
                otherBadge.textContent = selectedHotel.tiers.other.label
                    ? '環哩匯其他會員（' + selectedHotel.tiers.other.label + '）'
                    : '環哩匯其他會員';
            }
            if (tierItems[2]) {
                tierItems[2].style.display = selectedHotel.customInputMode ? 'none' : '';
            }
            
            const benefitsList = document.querySelector('#panel-calculator .calc-benefits-list ul');
            if (benefitsList) {
                benefitsList.innerHTML = selectedHotel.benefits.map(b => '<li>' + b + '</li>').join('');
            }
            
            calculateCashback();
        }

        async function fetchExchangeRate() {
            const statusEl = document.getElementById('calcRateStatus');
            const rateInput = document.getElementById('calcExchangeRate');
            const refreshBtn = document.querySelector('.calc-refresh-btn');
            
            if (!statusEl || !rateInput) return;
            
            statusEl.className = 'calc-rate-status loading';
            statusEl.textContent = '🔄 取得匯率中...';
            if (refreshBtn) refreshBtn.classList.add('spinning');
            
            // 第二個 API 釘在特定版本以防供應鏈攻擊。需要更新時可至 https://github.com/fawazahmed0/exchange-api 查看最新日期版本號。
            const apis = [
                {
                    name: 'Open ExchangeRate API',
                    url: 'https://open.er-api.com/v6/latest/USD',
                    parse: (data) => data.rates?.TWD
                },
                {
                    name: 'Currency API',
                    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2026.4.1/v1/currencies/usd.json',
                    parse: (data) => data.usd?.twd
                }
            ];
            
            for (const api of apis) {
                try {
                    const response = await fetch(api.url);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    
                    const data = await response.json();
                    const rate = api.parse(data);
                    
                    if (rate && typeof rate === 'number') {
                        rateInput.value = rate.toFixed(4);
                        statusEl.className = 'calc-rate-status success';
                        statusEl.textContent = '✓ 已更新 (' + new Date().toLocaleTimeString() + ')';
                        if (refreshBtn) refreshBtn.classList.remove('spinning');
                        calculateCashback();
                        return;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            statusEl.className = 'calc-rate-status error';
            statusEl.textContent = '✗ 自動取得失敗，使用預設值';
            if (refreshBtn) refreshBtn.classList.remove('spinning');
        }

        function calculateCashback() {
            const hotelSelect = document.getElementById('calcHotel');
            const selectedHotelData = hotelData[hotelSelect ? hotelSelect.value : 'courtyard'];
            const applySpecialPlan = document.getElementById('calcApplySpecialPlan')?.checked ?? true;
            const huanlihuiTier = document.getElementById('calcHuanlihuiTier').value;
            const marriottTier = document.getElementById('calcMarriottTier').value;
            const roomPrice = parseFloat(document.getElementById('calcRoomPrice').value) || 23888;
            const actualPrice = parseFloat(document.getElementById('calcActualPrice').value) || roomPrice;
            const exchangeRate = parseFloat(document.getElementById('calcExchangeRate').value) || 32.5;
            const taxRate = parseFloat(document.getElementById('calcTaxRate').value) || 0.166;
            const nights = parseInt(document.getElementById('calcNights').value) || 1;
            const pointValue = parseFloat(document.getElementById('calcPointValue').value) || 0.23;
            const breakfastValue = parseFloat(document.getElementById('calcBreakfastValue').value) || 0;
            const parkingValue = parseFloat(document.getElementById('calcParkingValue').value) || 0;
            const otherPointsInput = parseFloat(document.getElementById('calcOtherPoints').value) || 0;

            const preTaxPriceUSD = (roomPrice / (1 + taxRate)) / exchangeRate;
            const basePoints = Math.floor(preTaxPriceUSD * 10) * nights;
            const tierBonusRate = tierBonusRates[marriottTier] ?? 0;
            const tierPoints = Math.floor(basePoints * tierBonusRate);
            
            let promoPoints = 0;
            if (selectedHotelData && applySpecialPlan) {
                if (huanlihuiTier === 'diamond') {
                    promoPoints = selectedHotelData.tiers.diamond.promo;
                } else if (huanlihuiTier === 'other') {
                    promoPoints = selectedHotelData.tiers.other.promo;
                }
            }
            
            const extraBonusPoints = (selectedHotelData && selectedHotelData.extraBonus && applySpecialPlan) ? selectedHotelData.extraBonus * nights : 0;
            const totalPoints = basePoints + tierPoints + promoPoints + extraBonusPoints + otherPointsInput;

            document.getElementById('calcBasePoints').value = basePoints;
            document.getElementById('calcTierPoints').value = tierPoints;
            document.getElementById('calcPromoPoints').value = promoPoints;

            const pointsValueCalc = totalPoints * pointValue;
            const breakfastTotal = breakfastValue * nights * 2;
            const parkingTotal = parkingValue * nights;
            const totalValue = pointsValueCalc + breakfastTotal + parkingTotal;
            
            const totalCost = actualPrice * nights;
            const cashbackRate = (totalValue / totalCost) * 100;
            const actualCost = Math.max(0, totalCost - totalValue);

            document.getElementById('resultCalcBasePoints').textContent = basePoints.toLocaleString() + ' 點';
            document.getElementById('resultCalcTierPoints').textContent = tierPoints.toLocaleString() + ' 點';
            document.getElementById('resultCalcPromoPoints').textContent = promoPoints.toLocaleString() + ' 點';
            
            const extraBonusRow = document.getElementById('extraBonusRow');
            if (extraBonusPoints > 0) {
                extraBonusRow.style.display = 'flex';
                document.getElementById('resultCalcExtraBonus').textContent = extraBonusPoints.toLocaleString() + ' 點';
            } else {
                extraBonusRow.style.display = 'none';
            }
            
            document.getElementById('resultCalcOtherPoints').textContent = otherPointsInput.toLocaleString() + ' 點';
            document.getElementById('resultCalcTotalPoints').textContent = totalPoints.toLocaleString() + ' 點';
            
            document.getElementById('resultCalcPointsValue').textContent = 'NT$ ' + Math.round(pointsValueCalc).toLocaleString();
            document.getElementById('resultCalcBreakfastValue').textContent = 'NT$ ' + breakfastTotal.toLocaleString();
            document.getElementById('resultCalcParkingValue').textContent = 'NT$ ' + parkingTotal.toLocaleString();
            document.getElementById('resultCalcTotalValue').textContent = 'NT$ ' + Math.round(totalValue).toLocaleString();
            
            document.getElementById('calcCashbackRate').textContent = cashbackRate.toFixed(1) + '%';
            document.getElementById('calcActualCost').textContent = Math.round(actualCost).toLocaleString();

            const meter = document.getElementById('calcCashbackMeter');
            const displayRate = Math.min(cashbackRate, 100);
            meter.style.width = displayRate + '%';
            meter.textContent = cashbackRate.toFixed(1) + '%';

            const suggestionBox = document.getElementById('calcSuggestionBox');
            if (cashbackRate >= 100) {
                meter.style.background = 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)';
                document.getElementById('calcCashbackRate').style.color = '#22c55e';
                suggestionBox.className = 'calc-suggestion good';
                suggestionBox.textContent = '🎉 超值！回饋超過100%，強烈推薦入住！';
            } else if (cashbackRate >= 50) {
                meter.style.background = 'linear-gradient(90deg, var(--gold-dark) 0%, #4ade80 100%)';
                document.getElementById('calcCashbackRate').style.color = '#4ade80';
                suggestionBox.className = 'calc-suggestion good';
                suggestionBox.textContent = '✅ 回饋比例優秀，值得入住！';
            } else if (cashbackRate >= 30) {
                meter.style.background = 'linear-gradient(90deg, var(--gold-dark) 0%, var(--gold) 100%)';
                document.getElementById('calcCashbackRate').style.color = 'var(--gold)';
                suggestionBox.className = 'calc-suggestion';
                suggestionBox.textContent = '💡 回饋比例尚可，可考慮入住。';
            } else {
                meter.style.background = 'linear-gradient(90deg, #ef4444 0%, var(--gold-dark) 100%)';
                document.getElementById('calcCashbackRate').style.color = '#f87171';
                suggestionBox.className = 'calc-suggestion bad';
                suggestionBox.textContent = '⚠️ 回饋比例較低，建議比較其他方案。';
            }
        }

        updateHotelInfo();
        fetchExchangeRate();

        const tooltipBox = document.createElement('div');
        tooltipBox.className = 'tooltip-box';
        document.body.appendChild(tooltipBox);

        let activeTooltip = null;

        function showTooltip(element) {
            const tipText = element.getAttribute('data-tip');
            if (!tipText) return;
            
            tooltipBox.textContent = tipText;
            tooltipBox.classList.add('show');
            
            const rect = element.getBoundingClientRect();
            const boxRect = tooltipBox.getBoundingClientRect();
            
            let left = rect.left + rect.width / 2 - boxRect.width / 2;
            let top = rect.top - boxRect.height - 10;
            
            if (left < 10) left = 10;
            if (left + boxRect.width > window.innerWidth - 10) {
                left = window.innerWidth - boxRect.width - 10;
            }
            if (top < 10) {
                top = rect.bottom + 10;
            }
            
            tooltipBox.style.left = left + 'px';
            tooltipBox.style.top = top + 'px';
            activeTooltip = element;
        }

        function hideTooltip() {
            tooltipBox.classList.remove('show');
            activeTooltip = null;
        }

        document.querySelectorAll('.info-tooltip').forEach(tooltip => {
            tooltip.addEventListener('mouseenter', function(e) {
                showTooltip(this);
            });

            tooltip.addEventListener('mouseleave', function() {
                hideTooltip();
            });

            tooltip.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (activeTooltip === this && tooltipBox.classList.contains('show')) {
                    hideTooltip();
                } else {
                    showTooltip(this);
                }
            });

            tooltip.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (activeTooltip === this && tooltipBox.classList.contains('show')) {
                    hideTooltip();
                } else {
                    showTooltip(this);
                }
            }, { passive: false });
        });

        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('info-tooltip') && activeTooltip) {
                hideTooltip();
            }
        });

        document.addEventListener('touchstart', function(e) {
            if (!e.target.classList.contains('info-tooltip') && activeTooltip) {
                hideTooltip();
            }
        });
