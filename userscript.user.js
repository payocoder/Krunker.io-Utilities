// ==UserScript==
// @name                Krunker Hacks by Gpy-Dev
// @namespace           Gpy-Dev
// @author              Gpy-Dev
// @description         Aimbot, ESP, Ammo and more.
// @version             1.8.3
// @icon                https://www.google.com/s2/favicons?domain=krunker.io
// @require             http://code.jquery.com/jquery-3.3.1.min.js
// @require             https://code.jquery.com/ui/1.12.0/jquery-ui.min.js
// @require             https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.0/jquery-confirm.min.js
// @match               *://krunker.io/*
// @grant               none
// ==/UserScript==
class Utilities {
    constructor() {
        this.exports;
        this.ui;
        this.me;
        this.world;
        this.inputs;
        this.control;
        this.socket;
        this.server;
        this.keys = new Set();
        this.features = [];
        this.colors = ['Green', 'Orange', 'DodgerBlue', 'Black', 'Red'];
        this.settings = {
            showMenu: true,
            espMode: 4,
            espColor: 0,
            espFontSize: 14,
            tracers: true,
            canShoot: true,
            scopingOut: false,
            isSliding: false,
        }
        this.canvas = null;
        this.ctx = null;
		let interval_ui = setInterval(() => {
            if (document.getElementById("inGameUI") !== null) {
                clearInterval(interval_ui);
                this.onLoad();
            }
        }, 100);
    }

    onLoad() {
        addEventListener("keydown", e => {
            if ("INPUT" == window.document.activeElement.tagName) return;
			//if (event.shiftKey) {
			//	alert("The SHIFT key was pressed!");
			//}
			//if (event.ctrlKey) {
				//alert("The CTRL key was pressed!");
			//}
			const key = e.key.toUpperCase();
			if (!this.keys.has(key)) this.keys.add(key);
        });
        addEventListener("keyup", e => {
			const key = e.key.toUpperCase();
            if (this.keys.has(key)) this.keys.delete(key);
            for (const feature of this.features) {
                if (feature.hotkey.toUpperCase() === key) {
                    this.onUpdated(feature);
                }
            }
            if (key === "DELETE") this.resetSettings();
            if (key === "M") this.settings.showMenu ^=1;
        })

        this.newFeature('AutoAim', "1", ['Off', 'Aim Assist', 'Aim Bot', 'Trigger Bot']);
        this.newFeature('AutoBhop', "2", ['Off', 'Auto Jump', 'Auto Slide']);
        this.newFeature('EspMode', "3", ['Off', 'Full', '2d', 'Walls']);
        this.newFeature('AutoReload', "4", []);
        this.newFeature('InfinityAmmo', "5", []);
        let interval_leader = setInterval(() => {
            if (document.querySelector('#killCount') !== null) {
                clearInterval(interval_leader);
                this.createInfoBox();
            }
        }, 100);
    }
    createInfoBox() {
       let width = 320, height = 280, X = 20, Y = 280;
       const killCount = document.querySelector('#killCount');
        if (killCount) {
            var infoBox = document.createElement('div');
			infoBox.style = "background-color: rgba(0,0,0,0.25);border-radius:5%;text-align:center;margin-top:5%;";
            if (infoBox) infoBox.innerHTML = '<div><h1> <style> #InfoBox { text-align: left; width: 310px; z-index: 3; padding: 10px; padding-left: 20px; padding-right: 20px; color: rgba(253, 136, 3, 0.7); line-height: 25px; margin-top: 0px; background-color: rgba(236, 159, 6.3); } #InfoBox .utilitiesTitle { font-size: 16px; font-weight: bold; text-align: center; color: #FFC147; margin-top: 5px; margin-bottom: 5px; } #InfoBox .leaderItem { font-size: 14px; } </style></h1> <div id="InfoBox"></div> </div>'.trim();
            killCount.parentNode.insertBefore(infoBox.firstChild, killCount.nextSibling);
            this.updateInfoBox();
        }
    }
    updateInfoBox() {
        const infoBox = document.querySelector('#InfoBox');
        if (infoBox) {
            const lines = this.features.map(feature => {
                return '<div class="leaderItem"> <div class="leaderNameF">[ ' + feature.hotkey.toUpperCase() + ' ]  ' + this.colorText(feature.name, [108, 52, 131]) + '</div> <div class="leaderScore">' + this.colorText(feature.valueStr, this.featureColor(feature.valueStr)) + '</div> </div>';
            });
            infoBox.innerHTML = '<div><span style="color:#0007f0;">K</span><span style="color:#3607c0;">R</span><span style="color:#6c088f;">U</span><span style="color:#a2085f;">N</span><span style="color:#d8082e;">K</span><span style="color:#cd0c50;">E</span><span style="color:#c20f73;">R</span><span style="color:#b81395;">P</span><span style="color:#ad16b8;">L</span><span style="color:#a21ada;">U</span><span style="color:#952fe1;">S</span><span style="color:#8945e7;"> </span><span style="color:#7c5aee;">v</span><span style="color:#6f6ff4;">3</span></div>'+ lines.join('').trim();
        }
    }
	keyDown(key) {
		return this.keys.has(key);
	}

    byte2Hex(n) {
        var chars = "0123456789ABCDEF";
        return String(chars.substr((n >> 4) & 0x0F,1)) + chars.substr(n & 0x0F,1);
    }

    rgb2hex(r,g,b) {
        return '#' + this.byte2Hex(r) + this.byte2Hex(g) + this.byte2Hex(b);
    }

    colorText(str, rgb, options) {
        return String( '<font style="color:' + this.rgb2hex(rgb[0],rgb[1],rgb[2]) + '"' + options + '>' + str + '</font>');
    }

    onTick(me, world, inputs) {
        this.me = me;
        this.world = world;
        this.inputs = inputs;
        this.server=this.exports.c[7].exports;

        for (let i = 0, sz = this.features.length; i < sz; i++) {
            const feature = this.features[i];
            switch (feature.name) {
                case 'AutoAim':
                    this.autoAim(feature.value);
                    break;
                case 'AutoReload':
                    if (feature.value) this.wpnReload();
                    break;
                case 'AutoBhop':
                    this.autoBhop(feature.value);
                    break;
                //case 'NoDeathDelay':
                    //if (feature.value && this.me && this.me.health === 0) {
                        //this.server.deathDelay = 0;
                    //}
                   // break;
                case 'EspMode':
                    this.settings.espMode = feature.value;
                    break;
                case 'InfinityAmmo':
                    this.InfinityAmmo(feature.value);
                    break;
            }
        }
    }

    resetSettings() {
        if (confirm("Are you sure you want to reset all your skid settings? This will also refresh the page")) {
            Object.keys(window.localStorage).filter(x => x.includes("utilities_")).forEach(x => window.localStorage.removeItem(x));
            window.location.reload();
        }
    }

     newFeature(name, key, array) {
        const cStruct = (...keys) => ((...v) => keys.reduce((o, k, i) => {
            o[k] = v[i];
            return o
        }, {}));
        const feature = cStruct('name', 'hotkey', 'value', 'valueStr', 'container')
        const value = parseInt(window.getSavedVal("utilities_" + name) || 0);
        this.features.push(feature(name, key, value, array.length ? array[value] : value ? "On" : "Off", array));
    }

    getFeature(name) {
        for (const feature of this.features) {
            if (feature.name.toLowerCase() === name.toLowerCase()) {
                return feature;
            }
        }
        return null;
    }

    featureColor(valueStr) {
        switch(valueStr) {
            case "On": return [178,242,82];
            case "Off": return [235,86,86];
            default: return [32,146,236];
        }
    }

    onUpdated(feature) {
        if (feature.container.length) {
            feature.value += 1;
            if (feature.value > feature.container.length - 1) {
                feature.value = 0;
            }
            feature.valueStr = feature.container[feature.value];
        } else {
            feature.value ^= 1;
            feature.valueStr = feature.value ? "On" : "Off";
        }
        window.saveVal("utilities_" + feature.name, feature.value);
        this.updateInfoBox();
    }

    getDistance3D(fromX, fromY, fromZ, toX, toY, toZ) {
        var distX = fromX - toX,
            distY = fromY - toY,
            distZ = fromZ - toZ;
        return Math.sqrt(distX * distX + distY * distY + distZ * distZ);
    }

    getDistance(player1, player2) {
        return this.getDistance3D(player1.x, player1.y, player1.z, player2.x, player2.y, player2.z);
    }

    getDirection(fromZ, fromX, toZ, toX) {
        return Math.atan2(fromX - toX, fromZ - toZ);
    }

    getXDir(fromX, fromY, fromZ, toX, toY, toZ) {
        var dirY = Math.abs(fromY - toY),
            dist = this.getDistance3D(fromX, fromY, fromZ, toX, toY, toZ);
        return Math.asin(dirY / dist) * (fromY > toY ? -1 : 1);
    }

    getAngleDist(start, end) {
        return Math.atan2(Math.sin(end - start), Math.cos(start - end));
    }

    camLookAt(X, Y, Z) {
        const currentXDR = this.control.xDr;
        const currentYDR = this.control.yDr;
        var xdir = this.getXDir(this.control.object.position.x, this.control.object.position.y, this.control.object.position.z, X, Y, Z),
            ydir = this.getDirection(this.control.object.position.z, this.control.object.position.x, Z, X),
            camChaseDst = this.server.camChaseDst;
        this.control.target = {
            xD: xdir,
            yD: ydir,
            x: X + camChaseDst * Math.sin(ydir) * Math.cos(xdir),
            y: Y - camChaseDst * Math.sin(xdir),
            z: Z + camChaseDst * Math.cos(ydir) * Math.cos(xdir)
        }
        this.control.xDr = currentXDR;
        this.control.yDr = currentYDR;
    }

    lookAt(target) {
        this.camLookAt(target.x2, target.y2 + target.height - target.headScale / 2 - this.server.crouchDst * target.crouchVal - this.me.recoilAnimY * this.server.recoilMlt * 25, target.z2);
    }

    getStatic(s, d) {
        if (typeof s == 'undefined') {
            return d;
        }
        return s;
    }

    teamColor(player) {
        return player.team === null ? '#FF4444' : this.me.team === player.team ? '#44AAFF' : '#FF4444';
    }

    getTarget() {
        const players = this.world.players.list.filter(player => { return player.active && !player.isYou });
        const targets = players.filter(player => {
            return player.cnBSeen && (!player.team || player.team !== this.me.team)
        }).sort((p1, p2) => this.getDistance(this.me, p1) - this.getDistance(this.me, p2));
        return targets[0];
    }

    autoAim(value) {
        if (!value) return;
        var lockedOn = false;
        const target = this.getTarget();
        if (this.me.didShoot) {
            this.settings.canShoot = false;
            setTimeout(() => {
                this.settings.canShoot = true;
            }, this.me.weapon.rate / 1.85);
        }
        if (target) {
            switch (value) {
                case 1:
                    /*Aim Assist*/
                    if (this.control.mouseDownR === 1) {
						this.world.config.deltaMlt = this.settings.delta;
                        this.lookAt(target);
						this.world.config.deltaMlt = 1;
                        lockedOn = true;
                    } else {
						lockedOn = false;
                    }
                    break;
                case 2:
                    /*Aim Bot*/
					if (this.control.mouseDownL === 1) {
						this.control.mouseDownL = 0;
						this.control.mouseDownR = 0;
						this.settings.scopingOut = true;
					}
					if (this.me.aimVal === 1) {
						this.settings.scopingOut = false;
					}
					if (!this.settings.scopingOut && this.settings.canShoot && this.me.recoilForce <= 0.01) {
						this.world.config.deltaMlt = this.settings.delta;
                    this.lookAt(target);
						if (this.control.mouseDownR !== 2) {
                        this.control.mouseDownR = 2;
						}
                        lockedOn = true;
						this.world.config.deltaMlt = 1;
					}	else lockedOn = false;
                    break;
                case 3:
                    /*Trigger Bot*/
                    lockedOn = this.quickscoper(target);
                    break;
            }
        }
        if (!lockedOn) {
			this.world.config.deltaMlt = 1;
            this.camLookAt(null);
            this.control.target = null;
            if (this.control.mouseDownR == 0) {
                this.control.mouseDownR = 0;
            }
        }
    }

quickscoper(target) {
        if (this.control.mouseDownL === 1) {
            this.control.mouseDownL = 0;
            this.control.mouseDownR = 0;
            this.settings.scopingOut = true;
        }

        if (this.me.aimVal === 1) {
            this.settings.scopingOut = false;
        }

        if (this.settings.scopingOut || !this.settings.canShoot) {
            return false;
        }

        if (this.me.recoilForce > 0.01) {
			this.world.config.deltaMlt = 1;
            return false;
        }
		this.world.config.deltaMlt = 5;
		this.lookAt(target);
		if (this.control.mouseDownR !== 2) {
			this.control.mouseDownR = 2;
		}
        if (this.me.aimVal < 0.2) {
			this.world.config.deltaMlt = 5;
            this.control.mouseDownL ^= 1;
			this.world.config.deltaMlt = 1;
        }

        return true;
    }

    autoBhop(value) {
        if (!value) return;
        if (this.keyDown(" ")) { //Space
            this.control.keys[this.control.jumpKey] = !this.control.keys[this.control.jumpKey];
            if (value === 2) {
                if (this.settings.isSliding) {
                    this.inputs[8] = 1;
                    return;
                }
                if (this.me.yVel < -0.04 && this.me.canSlide) {
                    this.settings.isSliding = true;
                    setTimeout(() => {
                        this.settings.isSliding = false;
                    }, this.me.slideTimer);
                    this.inputs[8] = 1;
                }
            }
        }
    }
    InfinityAmmo(value) {
        if (!value) return;
		function InfinityAmmo(){
			document.getElementById("ammoVal").innerHTML = '9999';
		}
		setInterval(InfinityAmmo, 1000);
	}

    wpnReload(force = false) {
        //(inputs[9] = me.ammos[me.weaponIndex] === 0);
        const ammoLeft = this.me.ammos[this.me.weaponIndex];
        if (force || ammoLeft === 0) this.world.players.reload(this.me);
    }

     world2Screen(camera, pos3d, aY = 0) {
        let pos = pos3d.clone();
        pos.y += aY;
        pos.project(camera);
        pos.x = (pos.x + 1) / 2;
        pos.y = (-pos.y + 1) / 2;
        pos.x *= this.canvas.width || innerWidth;
        pos.y *= this.canvas.height || innerHeight;
        return pos;
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

    line(x1, y1, x2, y2, lW, sS) {
        this.ctx.save();
        this.ctx.lineWidth = lW + 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        this.ctx.stroke();
        this.ctx.lineWidth = lW;
        this.ctx.strokeStyle = sS;
        this.ctx.stroke();
        this.ctx.restore();
    }

    image(x, y, img, ox, oy, w, h) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.beginPath();
        this.ctx.drawImage(img, ox, oy, w, h);
        this.ctx.closePath();
        this.ctx.restore();
    }

    gradient(x, y, w, h, colors) {
        let grad = this.ctx.createLinearGradient(x, y, w, h);
        for (let i = 0; i < colors.length; i++) {
            grad.addColorStop(i, colors[i]);
        }
        return grad;
    }
//U2NyaXB0IGJ5IFRIRUdVWTNkcyBvdmVyaGF4Lm1s
    getTextMeasurements(arr) {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = ~~this.ctx.measureText(arr[i]).width;
        }
        return arr;
    }

	drawEsp(ui, world, myself) {
		const me = ui.camera.getWorldPosition()
		for (const entity of world.players.list.filter(x => !x.isYou && x.active)) {
			//if (!entity.rankIcon && entity.level > 0) {
			//	let rankVar = entity.level > 0 ? Math.ceil(entity.level / 3) * 3 : entity.level < 0 ? Math.floor(entity.level / 3) * 3 : entity.level;
			//	let rankId = Math.max(Math.min(100, rankVar - 2), 0);
			//	entity.rankIcon = new Image();
			//	entity.rankIcon.src = `./img/levels/${rankId}.png`;
			//}
			const target = entity.objInstances.position.clone();
			if (ui.frustum.containsPoint(target)) {
				let screenR = this.world2Screen(ui.camera, entity.objInstances.position.clone());
				let screenH = this.world2Screen(ui.camera, entity.objInstances.position.clone(), entity.height);
				let hDiff = ~~(screenR.y - screenH.y);
				let bWidth = ~~(hDiff * 0.6);
				const color = this.colors[this.settings.espColor];
				if (this.settings.espMode > 0 && this.settings.espMode != 3) {
					this.rect((screenH.x - bWidth / 2) - 7, ~~screenH.y - 1, 0, 0, 4, hDiff + 2, '#000000', false);
					this.rect((screenH.x - bWidth / 2) - 7, ~~screenH.y - 1, 0, 0, 4, hDiff + 2, '#44FF44', true);
					this.rect((screenH.x - bWidth / 2) - 7, ~~screenH.y - 1, 0, 0, 4, ~~((entity.maxHealth - entity.health) / entity.maxHealth * (hDiff + 2)), '#000000', true);
					this.ctx.save();
					this.ctx.lineWidth = 4;
					this.pixelTranslate(this.ctx, screenH.x - bWidth / 2, screenH.y);
					this.ctx.beginPath();
					this.ctx.rect(0, 0, bWidth, hDiff);
					this.ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
					this.ctx.stroke();
					this.ctx.lineWidth = 2;
					this.ctx.strokeStyle = entity.team === null ? '#FF4444' : myself.team === entity.team ? '#44AAFF' : '#FF4444';
					this.ctx.stroke();
					this.ctx.closePath();
					this.ctx.restore();
					if (this.settings.espMode === 1) {
						let playerDist = parseInt(this.getDistance3D(me.x, me.y, me.z, target.x, target.y, target.z) / 10);
						this.ctx.save();
						this.ctx.font = this.settings.espFontSize + 'px GameFont';
						let meas = this.getTextMeasurements([" ", playerDist, "m ", entity.level, "©", entity.name]);
						this.ctx.restore();
						let grad2 = this.gradient(0, 0, meas[4] * 5, 0, ["rgba(0, 0, 0, 0.25)", "rgba(0, 0, 0, 0)"]);
						let padding = 2;
						//if (entity.rankIcon && entity.rankIcon.complete) {
						//	let grad = this.gradient(0, 0, (meas[4] * 2) + meas[3] + (padding * 3), 0, ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.25)"]);
						//	this.rect(~~(screenH.x - bWidth / 2) - 12 - (meas[4] * 2) - meas[3] - (padding * 3), ~~screenH.y - padding, 0, 0, (meas[4] * 2) + meas[3] + (padding * 3), meas[4] + (padding * 2), grad, true);
						//	this.ctx.drawImage(entity.rankIcon, ~~(screenH.x - bWidth / 2) - 16 - (meas[4] * 2) - meas[3], ~~screenH.y - (meas[4] * 0.5), entity.rankIcon.width * ((meas[4] * 2) / entity.rankIcon.width), entity.rankIcon.height * ((meas[4] * 2) / entity.rankIcon.height));
						//	this.text(`${entity.level}`, `${this.settings.espFontSize}px GameFont`, '#FFFFFF', ~~(screenH.x - bWidth / 2) - 16 - meas[3], ~~screenH.y + meas[4] * 1);
						//}
						this.rect(~~(screenH.x + bWidth / 2) + padding, ~~screenH.y - padding, 0, 0, (meas[4] * 5), (meas[4] * 4) + (padding * 2), grad2, true);
						this.text(entity.name, this.settings.espFontSize+'px GameFont', entity.team === null ? '#FFCDB4' : myself.team === entity.team ? '#B4E6FF' : '#FFCDB4', (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 1)
						if (entity.clan) this.text('['+entity.clan+']', this.settings.espFontSize+'px GameFont', '#AAAAAA', (screenH.x + bWidth / 2) + 8 + meas[5], screenH.y + meas[4] * 1)
						this.text(entity.health+' HP', this.settings.espFontSize+'px GameFont', "#33FF33", (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 2)
						this.text(entity.weapon.name, this.settings.espFontSize+'px GameFont', "#DDDDDD", (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 3)
						this.text("[", this.settings.espFontSize+'px GameFont', "#AAAAAA", (screenH.x + bWidth / 2) + 4, screenH.y + meas[4] * 4)
						this.text(playerDist, this.settings.espFontSize+'px GameFont', "#DDDDDD", (screenH.x + bWidth / 2) + 4 + meas[0], screenH.y + meas[4] * 4)
						this.text("m]", this.settings.espFontSize+'px GameFont', "#AAAAAA", (screenH.x + bWidth / 2) + 4 + meas[0] + meas[1], screenH.y + meas[4] * 4)
					}
				}
				if (this.settings.espMode === 1 || this.settings.espMode === 2) this.line(innerWidth / 2, innerHeight - 1, screenR.x, screenR.y, 2, entity.team === null ? '#FF4444' : myself.team === entity.team ? '#44AAFF' : '#FF4444');
			}
		}
    }

	onRender(uiConfig, scale, world, ui, me, scale2) {
		if (uiConfig)
		{
			uiConfig.crosshairAlways = true;
			this.settings.espFontSize = uiConfig.dmgScale * 0.25;
			this.canvas = uiConfig.canvas || document.getElementById("game-overlay");
			this.ctx = this.canvas.getContext("2d");
			this.ctx.save();
			this.ctx.clearRect(0, 0, this.canvas.width || innerWidth, this.canvas.width || innerWidth);
			if (world && ui && me )
			{
				if ('none' == menuHolder['style']['display'] && 'none' == endUI['style']['display']) this.drawEsp(ui, world, me);
			}
			this.ctx.restore();
		}
	}
}

function patchGame(source) {
    source = Utilities.toString().concat(source);
    const patches = new Map()
     .set("exports", [/(\['__CANCEL__']=.*?\(\w+,\w+,(\w+)\){)(let)/, '$1window.utilities=new Utilities();utilities.exports=$2;$3'])
     .set("controlView", [/(if\(this\['target']\){)/, '$1this.object.rotation.y=this.target.yD;this.pitchObject.rotation.x=this.target.xD;const half=Math.PI/2;this.yDr=Math.max(-half,Math.min(half,this.target.xD))%Math.PI;this.xDr=this.target.yD%Math.PI;'])
     .set("control", [/(=this;this\['gamepad'])/, '=utilities.control$1'])
     .set("procInputs", [/(this\[\'procInputs\'\]=function\((\w+),(\w+),(\w+),(\w+)\)\{)/, '$1utilities.onTick(this,$3,$2);'])
     .set("ui", [/(this,\w+={};this\['frustum'])/, 'utilities.ui=$1'])
     .set("fixHowler", [/(Howler\['orientation'](.+?)\)\),)/, ``])
     .set("clearRec", [/(if\(\w+\['save']\(\),\w+\['scale']\(\w+,\w+\),)\w+\['clearRect']\(0x0,0x0,\w+,\w+\),(\w+\['showDMG']\))/, '$1$2'])
     .set("onRender", [/((\w+)\['render']=function\((\w+,\w+,\w+,\w+,\w+)\){)/, '$1utilities.onRender($2,$3);'])
     //.set("pInfo", [/(if\()(!\w+\['cnBSeen']\)continue;)/, '$1utilities.settings.espMode==1||utilities.settings.espMode==0&&$2'])
     .set("wallhack", [/(\(((\w+))=this\['map']\['manager']\['objects']\[(\w+)]\))(.+?)\)/, '$1.penetrable&&$2.active)'])
     .set("socket", [/(new WebSocket)/, 'utilities.socket=$1'])

    for (const [name, item] of patches) {
        const patched = source.replace(item[0], item[1]);
        if (source === patched) {
            alert(`Failed to patch ${name}`);
            continue;
        } else console.log("Successfully patched ", name);
        source = patched;
    }

    return source;
}

(function () {
    var hideHook = (fn, oFn) => { fn.toString = oFn.toString.bind(oFn) };
    const handler = { construct(target, args) { if (args.length == 2 && args[1].length >140000) { args[1] = patchGame(args[1]); } return new target(...args); } };
    const original = self.Function;
    self.Function = new Proxy(Function, handler);
    hideHook(Function, original);
})();

document.getElementById("aContainer").style.fontSize = "larger";
document.getElementById("krunkerio_728x90_1").remove();
document.getElementById("aContainer").innerHTML = 'HACKS BY Gpy-Dev';
document.getElementById("aContainer").style.color = "white";
var _0x4684=["\x43\x72\x65\x61\x74\x65\x64\x2F\x53\x63\x72\x69\x70\x74\x65\x64\x20\x42\x79\x20\x47\x70\x79\x2D\x44\x65\x76\x20\x28\x43\x4F\x50\x59\x52\x49\x47\x48\x54\x20\x32\x30\x31\x39\x2C\x20\x47\x70\x79\x2D\x44\x65\x76\x29"];alert(_0x4684[0])
