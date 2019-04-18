// ==UserScript==
// @name         Krunker.io Utilities Mod
// @description  Krunker.io Mod
// @updateURL    https://github.com/Tehchy/Krunker.io-Utilities/raw/master/lite.user.js
// @downloadURL  https://github.com/Tehchy/Krunker.io-Utilities/raw/master/lite.user.js
// @version      0.4.0
// @author       Tehchy
// @include      /^(https?:\/\/)?(www\.)?(.+)krunker\.io(|\/|\/\?(server|party|game)=.+)$/
// @grant        none
// @run-at       document-start
// ==/UserScript==

class Utilities {
    constructor() {
        this.fps = {
            cur: 0,
            times: [],
            elm: null
        };
        this.canvas = null;
        this.ctx = null;
        this.findingNew = false;
        this.deaths = 0;
        this.windowOpened = false;
        this.lastMenu = '';
        this.customImage = new Image();
        this.defaultSettings = null;
        this.settings = {
            showFPS: false,
            customCrosshair: 0,
            customCrosshairShape: 0,
            customCrosshairColor: '#FFFFFF',
            customCrosshairLength: 14,
            customCrosshairThickness: 2,
            customCrosshairOutline: 0,
            customCrosshairOutlineColor: '#000000',
            customCrosshairAlwaysShow: false,
            customCrosshairImage: '',
            showLeaderboard: true,
            customScope: 'https://krunker.io/textures/recticle.png',
            customScopeHideBoxes: false,
            customFlashOverlay: 'https://krunker.io/img/muzflash.png',
            customBlood: 'https://krunker.io/img/blood.png',
            customAmmo: 'https://krunker.io/textures/ammo_0.png',
            customNameSub: 'https://krunker.io/img/skull.png',
            customKills: 'https://krunker.io/img/skull.png',
            customTimer: 'https://krunker.io/img/timer.png',
            customMainLogo: 'https://krunker.io/img/krunker_logo_0.png',
            autoFindNew: false,
            matchEndMessage: '',
            deathCounter: false,
            forceChallenge: false,
            hideFullMatches: false,
            customADSDot: 'https://krunker.io/textures/dots/dot_0.png',
        };
        this.settingsMenu = [];
        this.onLoad();
    }

    createCanvas() {
        const hookedCanvas = document.createElement("canvas");
        hookedCanvas.id = "UtiltiesCanvas";
        hookedCanvas.width = innerWidth;
        hookedCanvas.height = innerHeight;
        function resize() {
            var ws = innerWidth / 1700;
            var hs = innerHeight / 900;
            hookedCanvas.width = innerWidth;
            hookedCanvas.height = innerHeight;
            hookedCanvas.style.width = (hs < ws ? (innerWidth / hs).toFixed(3) : 1700) + "px";
            hookedCanvas.style.height = (ws < hs ? (innerHeight / ws).toFixed(3) : 900) + "px";
        }
        window.addEventListener('resize', resize);
        resize();
        this.canvas = hookedCanvas;
        this.ctx = hookedCanvas.getContext("2d");
        const hookedUI = inGameUI;
        hookedUI.insertAdjacentElement("beforeend", hookedCanvas);
        requestAnimationFrame(() => this.render());
    }

    createMenu() {
        inviteButton.insertAdjacentHTML("afterend", '\n<div class="button small" onmouseenter="playTick()" onclick="showWindow(window.windows.length-1);">Join</div>');
        const rh = gameNameHolder.lastElementChild;
        rh.insertAdjacentHTML("beforeend", '<div class="button small" onmouseenter="playTick()" onclick="showWindow(window.windows.length);">Utilities</div>');
        let self = this;
        this.settingsMenu = {
            showFPS: {
                name: "Show FPS",
                pre: "<div class='setHed'><center>Utilities</center></div><div class='setHed'>Render</div><hr>",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("showFPS", this.checked)' ${self.settingsMenu.showFPS.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.showFPS = t;
                }
            },
            showLeaderboard: {
                name: "Show Leaderboard",
                val: 1,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("showLeaderboard", this.checked)' ${self.settingsMenu.showLeaderboard.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.showLeaderboard = t;
                    leaderDisplay.style.display = t ? "block" : "none";
                }
            },
            autoFindNew: {
                name: "New Lobby Finder",
                pre: "<br><div class='setHed'>Features</div><hr>",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("autoFindNew", this.checked)' ${self.settingsMenu.autoFindNew.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.autoFindNew = t;
                }
            },
            matchEndMessage: {
                name: "Match End Message",
                val: '',
                html() {
                    return `<input type='text' id='matchEndMessage' name='text' value='${self.settingsMenu.matchEndMessage.val}' oninput='window.utilities.setSetting("matchEndMessage", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.matchEndMessage = t;
                }
            },
            deathCounter: {
                name: "Death Counter",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("deathCounter", this.checked)' ${self.settingsMenu.deathCounter.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.deathCounter = t;
                    document.getElementById('deathCounter').style.display = t ? "inline-block" : "none";
                }
            },
            forceChallenge: {
                name: "Force Challenge Mode",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("forceChallenge", this.checked)' ${self.settingsMenu.forceChallenge.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.forceChallenge = t;
                    if (t && !challButton.lastElementChild.firstChild.checked) challButton.lastElementChild.firstChild.click();
                }
            },
            hideFullMatches: {
                name: "Hide Full Matches",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("hideFullMatches", this.checked)' ${self.settingsMenu.hideFullMatches.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.hideFullMatches = t;
                }
            },
            customCrosshair: {
                name: "Style",
                pre: "<br><div class='setHed'>Crosshair</div><hr>",
                val: 0,
                html() {
                    return `<select class="floatR" onchange="window.utilities.setSetting('customCrosshair', this.value)">
                    <option value="0"${self.settingsMenu.customCrosshair.val == 0 ? " selected" : ""}>Normal</option>
                    <option value="1"${self.settingsMenu.customCrosshair.val == 1 ? " selected" : ""}>Custom</option>
                    <option value="2"${self.settingsMenu.customCrosshair.val == 2 ? " selected" : ""}>Custom & Normal</option>
                    </select>`
                },
                set(t) {
                    self.settings.customCrosshair = parseInt(t);
                    self.ctx.clearRect(0, 0, innerWidth, innerHeight);
                }
            },
            customCrosshairImage: {
                name: "Image",
                val: '',
                html() {
                    return `<input type='url' id='customCrosshairImage' name='text' value='${self.settingsMenu.customCrosshairImage.val}' oninput='window.utilities.setSetting("customCrosshairImage", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customCrosshairImage = t;
                    if (self.customImage.src != t) {
                        if (t.length) {
                            self.customImage.src = t;
                        }
                    } 
                }
            },
            customCrosshairShape: {
                name: "Shape",
                val: 0,
                html() {
                    return `<select class="floatR" onchange="window.utilities.setSetting('customCrosshairShape', this.value)">
                    <option value="0"${self.settingsMenu.customCrosshairShape.val == 0 ? " selected" : ""}>Cross</option>
                    <option value="1"${self.settingsMenu.customCrosshairShape.val == 1 ? " selected" : ""}>Hollow Circle</option>
                    <option value="2"${self.settingsMenu.customCrosshairShape.val == 2 ? " selected" : ""}>Filled Circle</option>
                    <option value="3"${self.settingsMenu.customCrosshairShape.val == 3 ? " selected" : ""}>Image</option>
                    </select>`
                },
                set(t) {
                    self.settings.customCrosshairShape = parseInt(t);
                }
            },
            customCrosshairAlwaysShow: {
                name: "Always Show",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("customCrosshairAlwaysShow", this.checked)' ${self.settingsMenu.customCrosshairAlwaysShow.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.customCrosshairAlwaysShow = t;
                }
            },
            customCrosshairColor: {
                name: "Color",
                val: "#ffffff",
                html() {
                    return `<input type='color' id='crosshairColor' name='color' value='${self.settingsMenu.customCrosshairColor.val}' oninput='window.utilities.setSetting("customCrosshairColor", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customCrosshairColor = t;
                }
            },
            customCrosshairLength: {
                name: "Length",
                val: 16,
                html() {
                    return `<span class='sliderVal' id='slid_utilities_customCrosshairLength'>${self.settingsMenu.customCrosshairLength.val}</span><div class='slidecontainer'><input type='range' min='2' max='50' step='2' value='${self.settingsMenu.customCrosshairLength.val}' class='sliderM' oninput="window.utilities.setSetting('customCrosshairLength', this.value)"></div>`
                },
                set(t) {
                    self.settings.customCrosshairLength = parseInt(t);
                }
            },
            customCrosshairThickness: {
                name: "Thickness",
                val: 2,
                html() {
                    return `<span class='sliderVal' id='slid_utilities_customCrosshairThickness'>${self.settingsMenu.customCrosshairThickness.val}</span><div class='slidecontainer'><input type='range' min='2' max='20' step='2' value='${self.settingsMenu.customCrosshairThickness.val}' class='sliderM' oninput="window.utilities.setSetting('customCrosshairThickness', this.value)"></div>`
                },
                set(t) {
                    self.settings.customCrosshairThickness = parseInt(t);
                }
            },
            customCrosshairOutline: {
                name: "Outline",
                val: 0,
                html() {
                    return `<span class='sliderVal' id='slid_utilities_customCrosshairOutline'>${self.settingsMenu.customCrosshairOutline.val}</span><div class='slidecontainer'><input type='range' min='0' max='10' step='1' value='${self.settingsMenu.customCrosshairOutline.val}' class='sliderM' oninput="window.utilities.setSetting('customCrosshairOutline', this.value)"></div>`
                },
                set(t) {
                    self.settings.customCrosshairOutline = parseInt(t);
                }
            },
            customCrosshairOutlineColor: {
                name: "Outline Color",
                val: "#000000",
                html() {
                    return `<input type='color' id='crosshairOutlineColor' name='color' value='${self.settingsMenu.customCrosshairOutlineColor.val}' oninput='window.utilities.setSetting("customCrosshairOutlineColor", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customCrosshairOutlineColor = t;
                }
            },
            customMainLogo: {
                name: "Main Logo",
                pre: "<br><div class='setHed'>Customization</div><hr>",
                val: '',
                html() {
                    return `<input type='url' id='customMainLogo' name='text' value='${self.settingsMenu.customMainLogo.val}' oninput='window.utilities.setSetting("customMainLogo", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customMainLogo = t;
                    mainLogo.src = t.length > 1 ? t : 'https://krunker.io/img/krunker_logo_' + (menuRegionLabel.innerText == "Tokyo" ? 1 : 0) + '.png';
                }
            },
            customADSDot: {
                name: "ADS Dot",
                val: '',
                html() {
                    return `<input type='url' id='customADSDot' name='url' value='${self.settingsMenu.customADSDot.val}' oninput='window.utilities.setSetting("customADSDot", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customADSDot = t;
                    aimDot.src = t.length > 1 ? t : 'https://krunker.io/textures/dots/dot_0.png';
                }
            },
            customScope: {
                name: "Scope Image",
                val: '',
                html() {
                    return `<input type='url' id='customScope' name='url' value='${self.settingsMenu.customScope.val}' oninput='window.utilities.setSetting("customScope", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customScope = t;
                    recticleImg.src = t.length > 1 ? t : 'https://krunker.io/textures/recticle.png';
                }
            },
            customScopeHideBoxes: {
                name: "Hide Black Boxes",
                val: false,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("customScopeHideBoxes", this.checked)' ${self.settingsMenu.customScopeHideBoxes.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.customScopeHideBoxes = t;
                    [...document.querySelectorAll('.black')].forEach(el => el.style.display = t ? "none" : "block");
                }
            },
            customAmmo: {
                name: "Ammo Icon",
                val: '',
                html() {
                    return `<input type='url' id='customAmmo' name='url' value='${self.settingsMenu.customAmmo.val}' oninput='window.utilities.setSetting("customAmmo", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customAmmo = t;
                    ammoIcon.src = t.length > 1 ? t : 'https://krunker.io/textures/ammo_0.png';
                }
            },
            customFlashOverlay: {
                name: "Muzzle Flash",
                val: '',
                html() {
                    return `<input type='url' id='customFlashOverlay' name='url' value='${self.settingsMenu.customFlashOverlay.val}' oninput='window.utilities.setSetting("customFlashOverlay", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customFlashOverlay = t;
                    flashOverlay.src = t.length > 1 ? t : 'https://krunker.io/img/muzflash.png';
                }
            },
            customKills: {
                name: "Kill Icon",
                val: '',
                html() {
                    return `<input type='url' id='customKills' name='url' value='${self.settingsMenu.customKills.val}' oninput='window.utilities.setSetting("customKills", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customKills = t;
                    killsIcon.src = t.length > 1 ? t : 'https://krunker.io/img/skull.png';
                }
            },
            customBlood: {
                name: "Death Overlay",
                val: '',
                html() {
                    return `<input type='url' id='customBlood' name='url' value='${self.settingsMenu.customBlood.val}' oninput='window.utilities.setSetting("customBlood", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customBlood = t;
                    bloodDisplay.src = t.length > 1 ? t : 'https://krunker.io/img/blood.png';
                }
            },
            customTimer: {
                name: "Timer Icon",
                val: '',
                html() {
                    return `<input type='url' id='customTimer' name='url' value='${self.settingsMenu.customTimer.val}' oninput='window.utilities.setSetting("customTimer", this.value)' style='float:right;margin-top:5px'/>`
                },
                set(t) {
                    self.settings.customTimer = t;
                    timerIcon.src = t.length > 1 ? t : 'https://krunker.io/img/timer.png';
                }
            }
        };
        window.windows.push({
            header: "Join",
            gen: () => {
                return `<input id='gameURL' type='text' placeholder='Enter Game URL/Code' class='accountInput' style='margin-top:0' value=''></input>
                <div class='accountButton' onclick='window.utilities.joinGame()', style='width:100%'>Join</div>`;
            }
        });
        window.windows.push({
            header: "Utilities",
            gen: () => {
                var tmpHTML = "";
                for (var key in window.utilities.settingsMenu) {
                    if (window.utilities.settingsMenu[key].noShow) continue;
                    if (window.utilities.settingsMenu[key].pre) tmpHTML += window.utilities.settingsMenu[key].pre;
                    tmpHTML += "<div class='settName'>" + window.utilities.settingsMenu[key].name +
                        " " + window.utilities.settingsMenu[key].html() + "</div>";
                }
                tmpHTML += "<br><a onclick='window.utilities.resetSettings()' class='menuLink'>Reset Settings</a>";
                return tmpHTML;
            }
        });
        this.setupSettings();
    }

    setupSettings() {
        this.defaultSettings = JSON.parse(JSON.stringify(this.settings));
        for (const key in this.settingsMenu) {
            if (this.settingsMenu[key].set) {
                const nt = getSavedVal(`kro_set_utilities_${key}`);
                this.settingsMenu[key].val = null !== nt ? nt : this.settingsMenu[key].val;
                "false" === this.settingsMenu[key].val && (this.settingsMenu[key].val = !1)
                this.settingsMenu[key].set(this.settingsMenu[key].val, !0)
            }
        }
    }
    
    joinGame() {
        let code = gameURL.value || '';
        if (code.match(/^(https?:\/\/)?(www\.)?(.+)krunker\.io(|\/|\/\?(server|party|game)=.+)$/)) {
            location = code;
        } else if (code.match(/^([A-Z]+):(\w+)$/)) {
            location = location.origin + "/?game=" + code;
        }
    }
    
    changeProfileIcon() {
        let index = getSavedVal('classindex') || 0;
        menuMiniProfilePic.src = `https://krunker.io/textures/classes/icon_${index}.png`;
    }

    createFPSDisplay() {
        const el = document.createElement("div");
        el.id = "fps";
        el.style.position = "absolute";
        el.style.color = "green";
        el.style.top = "0.4em";
        el.style.left = "20px";
        el.style.fontSize = "8pt";
        this.fps.elm = el;
        document.getElementById("gameUI").appendChild(el);
    }
    
    updateFPS() {
        if (!this.settings.showFPS) return;
        const now = performance.now();
        for (; this.fps.times.length > 0 && this.fps.times[0] <= now - 1e3;) this.fps.times.shift();
        this.fps.times.push(now);
        this.fps.cur = this.fps.times.length;
        this.fps.elm.innerHTML = this.fps.cur;
        this.fps.elm.style.color = this.fps.cur > 50 ? 'green' : (this.fps.cur < 30 ? 'red' : 'orange');
    }

    createDeathCounter() {
        killCount.insertAdjacentHTML("afterend", `\n<div id="deathCounter" class="countIcon" style="display: none;"><i class="material-icons" style="color:red;font-size:35px;margin-right:8px">error</i><span id="deaths" style="color: rgba(255, 255, 255, 0.7)">0</span></div>`);
    }

    createObservers() {
        this.newObserver(crosshair, 'style', (target) => {
            if (this.settings.customCrosshair == 0) return;
            crosshair.style.opacity = this.crosshairOpacity(crosshair.style.opacity);
        }, false);
        
        this.newObserver(windowHolder, 'style', (target) => {
            this.windowOpened = target.firstElementChild.innerText.length ? true : false;
            if (!this.windowOpened) {
                if (['Select Class', 'Change Loadout'].includes(this.lastMenu)) {
                    this.changeProfileIcon();
                }
            }
        }, false);

        this.newObserver(windowHeader, 'childList', (target) => {
            if (!this.windowOpened) return;
            switch (target.innerText) {
                case 'Server Browser':
                    if (!this.settings.hideFullMatches) return;
                    if (!document.querySelector('.menuSelectorHolder')) return;
                    let pcount;
                    [...document.querySelectorAll('.serverPCount')].filter(el => (pcount = el.innerText.split('/'), pcount[0] == pcount[1])).forEach(el => el.parentElement.remove());
                    break;
                case 'Change Loadout':
                case 'Select Class':
                    this.changeProfileIcon();
                    break;
                default:
                    //console.log('Unused Window');
                    break;
            }
            this.lastMenu = target.innerText;
        }, false);
        
        this.newObserver(killCardHolder, 'style', () => {
            this.deaths++;
            document.getElementById('deaths').innerHTML = this.deaths; 
        });

        this.newObserver(victorySub, 'src', () => {
            this.deaths = 0;
            document.getElementById('deaths').innerHTML = this.deaths;
            
            if (this.settings.matchEndMessage.length) {
                this.sendMessage(this.settings.matchEndMessage);
            }
        });
        
        this.newObserver(instructionHolder, 'style', (target) => {
            if (this.settings.autoFindNew) {
                if (target.innerText.includes('Try seeking a new game') &&
                    !target.innerText.includes('Kicked for inactivity')) {
                        location = document.location.origin;
                    }
            }
        });
    }
    
    newObserver(elm, check, callback, onshow = true) {
        return new MutationObserver((mutationsList, observer) => {
            if (check == 'src' || onshow && mutationsList[0].target.style.display == 'block' || !onshow) {
                callback(mutationsList[0].target);
            }
        }).observe(elm, check == 'childList' ? {childList: true} : {attributes: true, attributeFilter: [check]});
    }
    
    sendMessage(msg) {
        chatInput.value = msg;
        chatInput.focus()
        window.pressButton(13);
        chatInput.blur();
    }

    pixelTranslate(ctx, x, y) {
        ctx.translate(~~x, ~~y);
    }

    rect(x, y, ox, oy, w, h, color, fill) {
        this.ctx.save();
        this.pixelTranslate(this.ctx, x, y);
        this.ctx.beginPath();
        fill ? this.ctx.fillStyle = color : this.ctx.strokeStyle = color;
        this.ctx.rect(ox, oy, w, h);
        fill ? this.ctx.fill() : this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
    }

    circle(x, y, r, w, color, fill = false) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.lineWidth = w;
        fill ? this.ctx.fillStyle = color : this.ctx.strokeStyle = color;
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        fill ? this.ctx.fill() : this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
    }
    
    image(x, y, img, ox, oy) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.beginPath();
        this.ctx.drawImage(img, ox, oy);
        this.ctx.closePath();
        this.ctx.restore();
        this.drawn = true;
    }

    createWatermark() {
        const el = document.createElement("div");
        el.id = "watermark";
        el.style.position = "absolute";
        el.style.color = "rgba(50,205,50, 0.3)";
        el.style.bottom = "0";
        el.style.left = "20px";
        el.style.fontSize = "6pt";
        el.innerHTML = "Krunker.io Utilities Mod";
        document.getElementById("gameUI").appendChild(el);
    }


    drawCrosshair() {
        if (this.settings.customCrosshair == 0) return;
        if (!this.settings.customCrosshairAlwaysShow && (aimDot.style.opacity != "0" || aimRecticle.style.opacity != "0")) return;

        let thickness = this.settings.customCrosshairThickness;
        let outline = this.settings.customCrosshairOutline;
        let length = this.settings.customCrosshairLength;

        let cx = (this.canvas.width / 2);
        let cy = (this.canvas.height / 2);

        if (this.settings.customCrosshairShape == 0) {
            if (outline > 0) {
                this.rect(cx - length - outline, cy - (thickness / 2) - outline, 0, 0, (length * 2) + (outline * 2), thickness + (outline * 2), this.settings.customCrosshairOutlineColor, true);
                this.rect(cx - (thickness * 0.50) - outline, cy - length - outline, 0, 0, thickness + (outline * 2), (length * 2) + (outline * 2), this.settings.customCrosshairOutlineColor, true);
            }

            this.rect(cx - length, cy - (thickness / 2), 0, 0, (length * 2) , thickness, this.settings.customCrosshairColor, true);
            this.rect(cx - (thickness * 0.50), cy - length, 0, 0, thickness, length * 2, this.settings.customCrosshairColor, true);
        } else if (this.settings.customCrosshairShape == 3) {
            this.image(0, 0, this.customImage, cx - (this.customImage.width / 2), cy - (this.customImage.height / 2));
        } else {
            if (outline > 0) this.circle(cx, cy, length, thickness + (outline * 2), this.settings.customCrosshairOutlineColor);
            this.circle(cx, cy, length, thickness, this.settings.customCrosshairColor, this.settings.customCrosshairShape == 2);
        }
    }

    crosshairOpacity(t) {
        return this.settings.customCrosshair == 1 ? 0 : t;
    }

    render() {
        if (this.settings.customCrosshair != 0) this.ctx.clearRect(0, 0, innerWidth, innerHeight);
        this.drawCrosshair();
        this.updateFPS();
        requestAnimationFrame(() => this.render());
    }

    resetSettings() {
        if (confirm("Are you sure you want to reset all your utilties settings? This will also refresh the page")) {
            Object.keys(localStorage).filter(x=>x.includes("kro_set_utilities_")).forEach(x => localStorage.removeItem(x));
            location.reload();
        }
    }

    setSetting(t, e) {
        if (document.getElementById(`slid_utilities_${t}`)) document.getElementById(`slid_utilities_${t}`).innerHTML = e;
        this.settingsMenu[t].set(e);
        this.settingsMenu[t].val = e;
        saveVal(`kro_set_utilities_${t}`, e);
    }

    onLoad() {
        this.createCanvas();
        this.createFPSDisplay();
        this.createWatermark();
        this.createDeathCounter();
        this.createMenu();
        this.createObservers();
        this.changeProfileIcon();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.utilities = new Utilities();
}, false);