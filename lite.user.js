// ==UserScript==
// @name         Krunker.io Utilities Mod
// @description  Krunker.io Mod
// @updateURL    https://github.com/Tehchy/Krunker.io-Utilities/raw/master/lite.user.js
// @downloadURL  https://github.com/Tehchy/Krunker.io-Utilities/raw/master/lite.user.js
// @version      0.5.2
// @author       Tehchy
// @include      /^(https?:\/\/)?(www\.)?(.+)krunker\.io(|\/|\/\?.+)$/
// @grant        none
// @run-at       document-start
// ==/UserScript==

class Utilities {
    constructor() {
        this.findingNew = false;
        this.settings = null;
        this.onLoad();
    }

    createSettings() {
        const selectStyle = `border: none; background: #eee; padding: 4px; float: right; margin-left: 10px;`;
        const textInputStyle = `border: none; background: #eee; padding: 6px; padding-bottom: 6px; float: right;`;
        this.settings = {
            showLeaderboard: {
                name: "Show Leaderboard",
                pre: "<div class='setHed'><center>Utilities</center></div><div class='setHed'>Render</div><hr>",
                val: true,
                html: _ => {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("showLeaderboard", this.checked)' ${this.settings.showLeaderboard.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set: val => {
                    leaderDisplay.style.display = val ? "block" : "none";
                }
            },
            autoFindNew: {
                name: "New Lobby Finder",
                pre: "<br><div class='setHed'>Features</div><hr>",
                val: false,
                html: _ => {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("autoFindNew", this.checked)' ${this.settings.autoFindNew.val ? "checked" : ""}><span class='slider'></span></label>`;
                }
            },
            forceChallenge: {
                name: "Force Challenge Mode",
                val: false,
                html: _ => {
                    return `<label class='switch'><input type='checkbox' onclick='window.utilities.setSetting("forceChallenge", this.checked)' ${this.settings.forceChallenge.val ? "checked" : ""}><span class='slider'></span></label>`;
                },
                set: val => {
                    if (val && !challButton.lastElementChild.firstChild.checked) challButton.lastElementChild.firstChild.click();
                }
            },
            customAmmo: {
                name: "Ammo Icon",
                pre: "<br><div class='setHed'>Customization</div><hr>",
                val: '',
                html: _ => {
                    return `<input type='url' id='customAmmo' placeholder='Ammo Icon URL' name='url' style='${textInputStyle}' value='${this.settings.customAmmo.val}' oninput='window.utilities.setSetting("customAmmo", this.value)' style='float:right;margin-top:5px'/>`
                },
                set: val => {
                    ammoIcon.src = val.length > 1 ? val : location.origin + '/textures/ammo_0.png';
                }
            },
            customKills: {
                name: "Kill Icon",
                val: '',
                html: _ => {
                    return `<input type='url' id='customKills' placeholder='Kill Icon URL' name='url' style='${textInputStyle}' value='${this.settings.customKills.val}' oninput='window.utilities.setSetting("customKills", this.value)' style='float:right;margin-top:5px'/>`
                },
                set: val => {
                    killsIcon.src = val.length > 1 ? val : location.origin + '/img/skull_0.png';
                }
            },
            customDeaths: {
                name: "Death Icon",
                val: '',
                html: _ => {
                    return `<input type='url' id='customDeaths' placeholder='Death Icon URL' name='url' style='${textInputStyle}' value='${this.settings.customDeaths.val}' oninput='window.utilities.setSetting("customDeaths", this.value)' style='float:right;margin-top:5px'/>`
                },
                set: val => {
                    deathsIcon.src = val.length > 1 ? val : location.origin + '/img/skull_1.png';
                }
            },
            customBlood: {
                name: "Death Overlay",
                val: '',
                html: _ => {
                    return `<input type='url' id='customBlood' placeholder='Death Overlay URL' name='url' style='${textInputStyle}' value='${this.settings.customBlood.val}' oninput='window.utilities.setSetting("customBlood", this.value)' style='float:right;margin-top:5px'/>`
                },
                set: val => {
                    bloodDisplay.src = val.length > 1 ? val : location.origin + '/img/blood.png';
                }
            },
            customTimer: {
                name: "Timer Icon",
                val: '',
                html: _ => {
                    return `<input type='url' id='customTimer' placeholder='Timer Icon URL' name='url' style='${textInputStyle}' value='${this.settings.customTimer.val}' oninput='window.utilities.setSetting("customTimer", this.value)' style='float:right;margin-top:5px'/>`
                },
                set: val => {
                    timerIcon.src = val.length > 1 ? val : location.origin + '/img/timer.png';
                }
            }
        };
		var old = window.windows[0].gen;
        window.windows[0].gen = _ => {
			var tmpHTML = "";
			for (var key in window.utilities.settings) {
				if (window.utilities.settings[key].noShow) continue;
				if (window.utilities.settings[key].pre) tmpHTML += window.utilities.settings[key].pre;
				tmpHTML += "<div class='settName' id='" + key + "_div' style='display:" + (window.utilities.settings[key].hide ? 'none' : 'block') +"'>" + window.utilities.settings[key].name +
					" " + window.utilities.settings[key].html() + "</div>";
			}
			tmpHTML += "<br><a onclick='window.utilities.resetSettings()' class='menuLink'>Reset Utilities</a>";
			return old() + tmpHTML;
        };
        this.setupSettings();
    }

    setupSettings() {
        for (const key in this.settings) {
            var tmpVal = getSavedVal(`kro_set_utilities_${key}`);
            this.settings[key].val = (tmpVal!== null)?tmpVal:this.settings[key].val;
            if (this.settings[key].val == "false") this.settings[key].val = false;
            if (this.settings[key].set) this.settings[key].set(this.settings[key].val, true);
        }
    }

    createObservers() {
        this.newObserver(instructionHolder, 'style', (target) => {
            if (this.settings.autoFindNew.val) {
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

    createWatermark() {
        const el = document.createElement("div");
        el.id = "watermark";
        el.style.position = "absolute";
        el.style.color = "rgba(50,205,50, 0.3)";
        el.style.bottom = "0";
        el.style.left = "20px";
        el.style.fontSize = "6pt";
        el.innerHTML = "Krunker.io Utilities Mod";
        gameUI.appendChild(el);
    }

    resetSettings() {
        if (confirm("Are you sure you want to reset all your utilties settings? This will also refresh the page")) {
            Object.keys(localStorage).filter(x=>x.includes("kro_set_utilities_")).forEach(x => localStorage.removeItem(x));
            location.reload();
        }
    }

    setSetting(t, e) {
        this.settings[t].val = e;
        saveVal(`kro_set_utilities_${t}`, e);
        if (document.getElementById(`slid_utilities_${t}`)) document.getElementById(`slid_utilities_${t}`).innerHTML = e;
        if (this.settings[t].set) this.settings[t].set(e);
    }

    keyDown(event) {
        if (document.activeElement.tagName == "INPUT") return;
        switch(event.key){
            case '`':
                if (event.ctrlKey || event.shiftKey) return;
                document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
                document.exitPointerLock();
                window.showWindow(window.windows.length);
                break;
        }
    }

    onLoad() {
        this.createWatermark();
        this.createSettings();
        this.createObservers();
        window.addEventListener("keydown", event => this.keyDown(event));
    }
}

document.addEventListener('DOMContentLoaded', _ => {
    window.utilities = new Utilities();
}, false);