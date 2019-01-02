// ==UserScript==
// @name         Krunker.io Utilities
// @description  Krunker.io Mod
// @updateURL    https://github.com/Tehchy/Krunker.io-Utilities/raw/master/userscript.user.js
// @downloadURL  https://github.com/Tehchy/Krunker.io-Utilities/raw/master/userscript.user.js
// @version      0.5
// @author       Tehchy
// @include      /^(https?:\/\/)?(www\.)?(.+)krunker\.io(|\/|\/\?(server|party)=.+)$/
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

/* eslint-env es6 */
window.stop();
document.innerHTML = "";

class Utilities {
    constructor() {
        this.me = null;
        this.camera = null;
        this.inputs = null;
        this.game = null;
        this.customMatch = false;
        this.hooks = {
            socket: null,
        };
        this.fps = {
            cur: 0,
            times: []
        };
        this.banList = [];
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            fpsCounter: false,
            fpsFontSize: 10,
            crosshairSize: 0,
            antiAlias: false,
            highPrecision: false,
            customCrosshair: 0,
            customCrosshairColor: "#FFFFFF",
            customCrosshairLength: 14,
            customCrosshairThickness: 2,
            customCrosshairOutline: 0,
            antiGuest: false,
        };
        this.settingsMenu = [];
        this.onLoad();
    }

    createCanvas() {
        const hookedCanvas = document.createElement("canvas");
        hookedCanvas.width = innerWidth;
        hookedCanvas.height = innerHeight;
        window.addEventListener('resize', () => {
            hookedCanvas.width = innerWidth;
            hookedCanvas.height = innerHeight;
        });
        this.canvas = hookedCanvas;
        this.ctx = hookedCanvas.getContext("2d");
        const hookedUI = document.getElementById("inGameUI");
        hookedUI.insertAdjacentElement("beforeend", hookedCanvas);
        requestAnimationFrame(this.render.bind(this));
    }

    createMenu() {
        const rh = document.getElementById('rightHolder');
        rh.insertAdjacentHTML("beforeend", "<br/><a href='javascript:;' onmouseover=\"SOUND.play('tick_0',0.1)\" onclick='showWindow(window.windows.length);' class=\"menuLink\">Utilities</a>");
        let self = this;
        this.settingsMenu = {
            fpsCounter: {
                name: "Show FPS",
                pre: "<div class='setHed'><center>Utilities</center></div><div class='setHed'>Render</div>",
                val: 1,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("fpsCounter", this.checked)' ${self.settingsMenu.fpsCounter.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.fpsCounter = t;
                }
            },
            fpsFontSize: {
                name: "FPS Font Size",
                val: 10,
                html() {
                    return `<select onchange="window.utilities.setSetting('fpsFontSize', this.value)">
                    <option value="10"${self.settingsMenu.fpsFontSize.val == 10 ? " selected" : ""}>Small</option>
                    <option value="14"${self.settingsMenu.fpsFontSize.val == 14 ? " selected" : ""}>Medium</option>
                    <option value="20"${self.settingsMenu.fpsFontSize.val == 20 ? " selected" : ""}>Large</option>
                    <option value="26"${self.settingsMenu.fpsFontSize.val == 26 ? " selected" : ""}>Giant</option>
                    </select>`
                },
                set(t) {
                    self.settings.fpsFontSize = parseInt(t)
                }
            },
            crosshairSize: {
                name: "Crosshair Size",
                val: 0,
                html() {
                    return `<span class='sliderVal' id='slid_utilities_crosshairSize'>${self.settingsMenu.crosshairSize.val}</span><div class='slidecontainer'><input type='range' min='0' max='100' step='2' value='${self.settingsMenu.crosshairSize.val}' class='sliderM' oninput="window.utilities.setSetting('crosshairSize', this.value)"></div>`
                },
                set(t) {
                    self.settings.crosshairSize = t
                }
            },
            customCrosshair: {
                name: "Crosshair Style",
                pre: "<div class='setHed'>Custom Crosshair</div>",
                val: 0,
                html() {
                    return `<select onchange="window.utilities.setSetting('customCrosshair', this.value)">
                    <option value="0"${self.settingsMenu.customCrosshair.val == 0 ? " selected" : ""}>Original</option>
                    <option value="1"${self.settingsMenu.customCrosshair.val == 1 ? " selected" : ""}>Custom</option>
                    <option value="2"${self.settingsMenu.customCrosshair.val == 2 ? " selected" : ""}>Both</option>
                    </select>`
                },
                set(t) {
                    self.settings.customCrosshair = parseInt(t);
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
                    return `<span class='sliderVal' id='slid_utilities_customCrosshairLength'>${self.settingsMenu.customCrosshairLength.val}</span><div class='slidecontainer'><input type='range' min='4' max='50' step='2' value='${self.settingsMenu.customCrosshairLength.val}' class='sliderM' oninput="window.utilities.setSetting('customCrosshairLength', this.value)"></div>`
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
            antiGuest: {
                name: "Auto Kick Guests",
                pre: "<div class='setHed'>Custom Games</div>",
                val: 0,
                html() {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("antiGuest", this.checked)' ${self.settingsMenu.antiGuest.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set(t) {
                    self.settings.antiGuest = t;
                }
            },
        };
    }

    setupSettings() {
        for (const key in this.settingsMenu) {
            if (this.settingsMenu[key].set) {
                const nt = this.getSavedVal(`kro_set_utilities_${key}`);
                this.settingsMenu[key].val = null !== nt ? nt : this.settingsMenu[key].val;
                "false" === this.settingsMenu[key].val && (this.settingsMenu[key].val = !1)
                this.settingsMenu[key].set(this.settingsMenu[key].val, !0)
            }
        }
    }

    keyDown(event) {
        if (document.activeElement.id === 'chatInput') return;
        if (event.keyCode === 9) {
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
            window.showWindow(window.windows.length - 1);
        }
    }

    keyUp(event) {
        if (document.activeElement.id === 'chatInput') return;
    }

    keyPress(event) {
        if (document.activeElement.id === 'chatInput') return;
    }

    chatMessage(t, e, n) {
        const chatList = document.getElementById('chatList');
        for (chatList.innerHTML += n ? `<div class='chatItem'><span class='chatMsg'>${e}</span></div><br/>` : `<div class='chatItem'>${t || "unknown"}: <span class='chatMsg'>${e}</span></div><br/>`; chatList.scrollHeight >= 250;) chatList.removeChild(chatList.childNodes[0])
    }

    pixelTranslate(ctx, x, y) {
        ctx.translate(~~x, ~~y);
    }

    text(txt, font, color, x, y) {
        this.ctx.save();
        this.pixelTranslate(this.ctx, x, y);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.font = font;
        this.ctx.lineWidth = 1;
        this.ctx.strokeText(txt, 0, 0);
        this.ctx.fillText(txt, 0, 0);
        this.ctx.restore();
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

    drawFPS() {
        if (!this.settings.fpsCounter) return;
        const now = performance.now();
        for (; this.fps.times.length > 0 && this.fps.times[0] <= now - 1e3;) this.fps.times.shift();
        this.fps.times.push(now);
        this.fps.cur = this.fps.times.length;
        this.text(this.fps.cur, `${this.settings.fpsFontSize}px GameFont`, this.fps.cur > 50 ? 'green' : (this.fps.cur < 30 ? 'red' : 'orange'), 20, 8 + this.settings.fpsFontSize);
        this.text("Krunker Utilities", `7px GameFont`, "rgba(255,255,255, 0.3)", this.canvas.width - 100, 15);
    }

    drawCrosshair() {
        if (this.settings.customCrosshair == 0) return;
        
        let thickness = this.settings.customCrosshairThickness;
        let outline = this.settings.customCrosshairOutline;
        let length = this.settings.customCrosshairLength;

        let cx = (this.canvas.width / 2);
        let cy = (this.canvas.height / 2);

        if (outline > 0) {
            this.rect(cx - length - outline, cy - (thickness / 2) - outline, 0, 0, (length * 2) + (outline * 2), thickness + (outline * 2), '#000000', true);
            this.rect(cx - (thickness * 0.50) - outline, cy - length - outline, 0, 0, thickness + (outline * 2), (length * 2) + (outline * 2), '#000000', true);
        }

        this.rect(cx - length, cy - (thickness / 2), 0, 0, (length * 2) , thickness, this.settings.customCrosshairColor, true);
        this.rect(cx - (thickness * 0.50), cy - length, 0, 0, thickness, length * 2, this.settings.customCrosshairColor, true);
    }

    getCrosshair(t) {
        if (this.settings.crosshairSize == 0) return t;
        return 37.75 + parseFloat(this.settings.crosshairSize);
    }

    crosshairOpacity(t) {
        return this.settings.customCrosshair == 1 ? 0 : t;
    }
    
    countSkins(y) {
        let d = 0;
        for (let i = 0; i < y.skins.length; i++) {
           d += y.skins[i].cnt - 1;
        }
        return "U:" + y.skins.length + ", D:" + d;
    }
    
    autoBan() {
        if (!this.customMatch) return
        let autoBan = this.game.players.list.filter(p => this.banList.includes(p.name));
        for (let player of autoBan) {
            this.hooks.socket.send("c", "/ban " + player.name)
        }
    }
    
    antiGuest() {
        if (!this.customMatch) return
        if (!this.settings.antiGuest) return;
        
        let guests = this.game.players.list.filter(p => p.name.match(/Guest_([0-9]{1}|1[0-5])$/));
        for (let player of guests) {
            this.hooks.socket.send("c", "/kick " + player.name)
        }
    }

    render() {
        this.ctx.clearRect(0, 0, innerWidth, innerHeight);
        this.drawCrosshair();
        this.drawFPS();
        requestAnimationFrame(this.render.bind(this));
    }
    
    loop(camera, me, inputs, game) {
        this.me = me;
        this.camera = camera;
        this.game = game;
        this.inputs = inputs;
        
        this.autoBan();
        this.antiGuest();
        
        if (!this.customMatch) this.banList = [];
    }

    setSetting(t, e) {
        if (document.getElementById(`slid_utilities_${t}`)) document.getElementById(`slid_utilities_${t}`).innerHTML = e;
        this.settingsMenu[t].set(e);
        this.settingsMenu[t].val = e;
        this.saveVal(`kro_set_utilities_${t}`, e);
    }

    saveVal(t, e) {
        const r = "undefined" != typeof Storage;
        r && localStorage.setItem(t, e)
    }

    getSavedVal(t) {
        const r = "undefined" != typeof Storage;
        return r ? localStorage.getItem(t) : null;
    }

    onLoad() {
        this.createCanvas();
        this.createMenu();
    }
}

GM_xmlhttpRequest({
    method: "GET",
    url: `${document.location.origin}/js/game.js`,
    onload: res => {
        let code = res.responseText;
        let game = /=(.)\.store\.purchases/.exec(code)[1];
        let sock = /return (.)\.send\("getMaps"\)/.exec(code)[1];
        code = code.replace(/String\.prototype\.escape=function\(\){(.*)\)},(Number\.)/, "$2")
            .replace(/(\w+).procInputs\((\w+),(\w+)\),(\w+).moveCam/, 'window.utilities.loop($4, $1, $2, $3), $1.procInputs($2,$3),$4.moveCam')
            .replace(/window\.updateWindow=function/, 'windows.push({header:"Player List",gen:function(){var t="<div style=\'margin-top:0px\' class=\'setHed\'><center>Player List</center></div><div class=\'settNameSmall\'><span class=\'floatR\'>Host Only</span></div>";for(let p of ' + game + '.players.list){t+="<div class=\'settName\'>"+p.name+(!p.isYou && window.utilities.customMatch?"<span class=\'floatR\'><span id=\'kick\' class=\'settText\' onclick=\'userAction(0, &quot;"+p.id+"&quot;)\'>Kick</span> | <span id=\'ban\' class=\'settText\' onclick=\'userAction(1, &quot;"+p.id+"&quot;)\'>Ban</span></span>":"")+"</div>";}return t;}});windows.push({header: "Utilities", html: "",gen: function () {var t = ""; for (var key in window.utilities.settingsMenu) {window.utilities.settingsMenu[key].pre && (t += window.utilities.settingsMenu[key].pre), t += "<div class=\'settName\'>" + window.utilities.settingsMenu[key].name + " " + window.utilities.settingsMenu[key].html() + "</div>";} return t;}});window.utilities.setupSettings();\nwindow.updateWindow=function')
            .replace(/window\.windows=/, 'window.userAction = function(type = 0, id) {let user = ' + game + '.players.list.filter(x => x.id == id);if(user){user = user[0];if(type==1)window.utilities.banList.push(user.name);' + sock + '.send("c", "/" + (type == 0 ? "kick" : "ban") + " " + user.name);}},window.windows =')
            .replace(/window\.addEventListener\("keydown",function\((\w+)\){/, 'window.addEventListener("keydown",function($1){window.utilities.keyDown($1),')
            .replace(/window\.addEventListener\("keyup",function\((\w+)\){/, 'window.addEventListener("keyup",function($1){window.utilities.keyUp($1),')
            .replace(/window\.addEventListener\("keypress",function\((\w+)\){/, 'window.addEventListener("keypress",function($1){window.utilities.keyPress($1),')
            .replace(/hitHolder\.innerHTML=(\w+)}\((\w+)\),(\w+).update\((\w+)\)(.*)"block"==nukeFlash\.style\.display/, 'hitHolder.innerHTML=$1}($2),$3.update($4),"block" === nukeFlash.style.display')
            .replace(/(\w+)\("Kicked for inactivity"\)\),(.*),requestAnimFrame\((\w+)\)/, '$1("Kicked for inactivity")),requestAnimFrame($3)')
            .replace(/(\w+).updateCrosshair=function\((\w+),(\w+)\){/, '$1.updateCrosshair=function($2,$3){$2=window.utilities.getCrosshair($2);')
            .replace(/antialias:!1/g, 'antialias:window.utilities.settings.antiAlias ? 1 : !1')
            .replace(/precision:"mediump"/g, 'precision:window.utilities.settings.highPrecision ? "highp": "mediump"')
            .replace(/crosshair\.style\.opacity\=(\w+)\)/, 'crosshair.style.opacity = window.utilities.crosshairOpacity($1))')
            .replace(/\((\w+).timePlayed\)\+"/, '($1.timePlayed)+"</span></div><div class=\'settName\'>Skins<span class=\'floatR\'>"+window.utilities.countSkins($1)+"')
            .replace(/if\(!this\.socket\){/, 'if(!this.socket){window.utilities.hooks.socket = this;')
            .replace(/(if\((\w+)\?(\w+).data)/, 'window.utilities.customMatch = $2;$1')
            .replace(/setTimeout\(\(\)=>{!(.*)},2500\);/, '');
        GM_xmlhttpRequest({
            method: "GET",
            url: document.location.origin,
            onload: res => {
                let html = res.responseText;
                html = html.replace(/ src="js\/game\.js">/, `>${Utilities.toString()}\nwindow.utilities = new Utilities();\n${code.toString()}`);
                document.open();
                document.write(html);
                document.close();
            }
        })
    }
})
