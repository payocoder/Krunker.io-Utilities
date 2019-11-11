// ==UserScript==
// @name         KrunkerPlusX
// @namespace    Gpy-Dev
// @version      1.8.8
// @description  Script Created by Gpy-Dev. All other scripts must be off in order to work!
// @author       Gpy-Dev
// @match        *://krunker.io/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function(){
    const replace = String.prototype.replace;
    let anti_map = [];

    const original_toString = Function.prototype.toString;
    let hook_toString = new Proxy(original_toString, {
        apply: function(target, _this, _arguments) {
            for (var i = 0; i < anti_map.length; i++) {
                if (anti_map[i].from === _this) {
                    return target.apply(anti_map[i].to, _arguments);
                }
            }
            return target.apply(_this, _arguments);
        }
    });
    anti_map.push({from: hook_toString, to: original_toString});
    Function.prototype.toString = hook_toString;

    let conceal_function = function(original_Function, hook_Function) {
        anti_map.push({from: hook_Function, to: original_Function});
    };

    let hidden_globals = [];
    const original_getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
    let hook_getOwnPropertyDescriptors = new Proxy(original_getOwnPropertyDescriptors, {
        apply: function(target, _this, _arguments) {
            let descriptors = target.apply(_this, _arguments);
            for (var i = 0; i < hidden_globals.length; i++) {
                delete descriptors[hidden_globals[i]];
            }
            return descriptors;
        }
    });
    Object.getOwnPropertyDescriptors = hook_getOwnPropertyDescriptors;
    conceal_function(original_getOwnPropertyDescriptors, hook_getOwnPropertyDescriptors);

    let invisible_define = function(obj, key, value) {
        hidden_globals.push(key);
        Object.defineProperty(obj, key, {
            enumberable: false,
            configurable: false,
            writable: true,
            value: value
        });
    };

    let define_global = function(key, value) {
        invisible_define(window, key, value);
    };

    let keyMap = {};
    let genKey = function() {
        let a = new Uint8Array(20);
        crypto.getRandomValues(a);
        return 'hrt'+Array.from(a,x=>('0'+x.toString(16)).substr(-2)).join('');
    }

    keyMap['init'] = genKey();
    define_global(keyMap['init'], false);

    // Gets overwritten later, so we can place render hooks before anti-cheat
    let drawVisuals = function() {};
    const original_clearRect = CanvasRenderingContext2D.prototype.clearRect;
    let hook_clearRect = new Proxy(original_clearRect, {
        apply: function(target, _this, _arguments) {
            target.apply(_this, _arguments);
            drawVisuals(_this);
        }
    });
    conceal_function(original_clearRect, hook_clearRect);
    CanvasRenderingContext2D.prototype.clearRect = hook_clearRect;

    let hrtCheat = function(me, inputs, world, consts, math, canSee, pchObjc, objInstances, isYou, recoilAnimY, mouseDownL, mouseDownR) {
        let controls = world.controls;
        if (controls.scrollDelta) {
            controls.skipScroll = controls.scrollToSwap;
            if (!controls.scrollToSwap) {
                controls.fakeKey(0x4e20,0x1);
            }
        }
        controls.scrollDelta = 0;
        controls.wSwap = 0;

        const SHOOT = 5, SCOPE = 6, xDr = 3, yDr = 2, JUMP = 7, CROUCH = 8;
        let isEnemy = function(player) {return !me.team || player.team != me.team};
        let canHit = function(player) {return null == world[canSee](me, player.x3, player.y3 - player.crouchVal * consts.crouchDst, player.z3)};
        let normaliseYaw = function(yaw) {return (yaw % Math.PI2 + Math.PI2) % Math.PI2;};
        let getDir = function(ber, bes, bet, bev) {
            return Math.atan2(bes - bev, ber - bet);
        };
        let getD3D = function(ber, bes, bet, bev, bew, bf3) {
            let bf4 = ber - bev, bf5 = bes - bew, bf6 = bet - bf3;
            return Math.sqrt(bf4 * bf4 + bf5 * bf5 + bf6 * bf6);
        };
        let getXDire = function(bes, bet, bev, bew, bfh, bfi) {
            let bfj = Math.abs(bet - bfh), bfk = getD3D(bes, bet, bev, bew, bfh, bfi);
            return Math.asin(bfj / bfk) * (bet > bfh ? -1 : 1);
        };

        let dAngleTo = function(x, y, z) {
            let ty = normaliseYaw(getDir(controls.object.position.z, controls.object.position.x, z, x));
            let tx = getXDire(controls.object.position.x, controls.object.position.y, controls.object.position.z, x, y, z);
            let oy = normaliseYaw(controls.object.rotation.y);
            let ox = controls[pchObjc].rotation.x;
            let dYaw = Math.min(Math.abs(ty - oy), Math.abs(ty - oy - Math.PI2), Math.abs(ty - oy + Math.PI2));
            let dPitch = tx - ox;
            return Math.hypot(dYaw, dPitch);
        };
        let calcAngleTo = function(player) {return dAngleTo(player.x3, player.y3 + consts.playerHeight - (consts.headScale + consts.hitBoxPad) / 2 - player.crouchVal * consts.crouchDst, player.z3);};
        let calcDistanceTo = function(player) {return getD3D(player.x3, player.y3, player.z3, me.x, me.y, me.z)};
        let isCloseEnough = function(player) {let distance = calcDistanceTo(player); return me.weapon.range >= distance && ("Shotgun" != me.weapon.name || distance < 70) && ("Akimbo Uzi" != me.weapon.name || distance < 100);};
        let haveAmmo = function() {return !(me.ammos[me.weaponIndex] !== undefined && me.ammos[me.weaponIndex] == 0);};
        // runs once
        if (!window[keyMap['init']]) {
            window[keyMap['init']] = true;

            drawVisuals = function(c) {
                let scalingFactor = arguments.callee.caller.caller.arguments[0];
                let perspective = arguments.callee.caller.caller.arguments[2];
                let scaledWidth = c.canvas.width / scalingFactor;
                let scaledHeight = c.canvas.height / scalingFactor;
                let worldPosition = perspective.camera.getWorldPosition();
                for (var i = 0; i < world.players.list.length; i++) {
                    let player = world.players.list[i];
                    let e = players[i];
                    if (e[isYou] || !e.active || !e[objInstances] || !isEnemy(e)) {
                        continue;
                    }
                    // find min x, max x, min y, max y
                    // optimisation: we can already tell what ymin ymax is
                    let xmin = Infinity;
                    let xmax = -Infinity;
                    let ymin = Infinity;
                    let ymax = -Infinity;
                    let br = false;
                    for (var j = -1; !br && j < 2; j+=2) {
                        for (var k = -1; !br && k < 2; k+=2) {
                            for (var l = 0; !br && l < 2; l++) {
                                let position = e[objInstances].position.clone();
                                position.x += j * consts.playerScale;
                                position.z += k * consts.playerScale;
                                position.y += l * (consts.playerHeight - e.crouchVal * consts.crouchDst);
                                if (!perspective.frustum.containsPoint(position)) {
                                    br = true;
                                    break;
                                }
                                position.project(perspective.camera);
                                xmin = Math.min(xmin, position.x);
                                xmax = Math.max(xmax, position.x);
                                ymin = Math.min(ymin, position.y);
                                ymax = Math.max(ymax, position.y);
                            }
                        }
                    }

                    if (br) {
                        continue;
                    }

                    xmin = (xmin + 1) / 2;
                    ymin = (ymin + 1) / 2;
                    xmax = (xmax + 1) / 2;
                    ymax = (ymax + 1) / 2;


                    c.save();
                    const original_strokeStyle = c.strokeStyle;
                    const original_lineWidth = c.lineWidth;
                    const original_font = c.font;
                    const original_fillStyle = c.fillStyle;

                    // perfect box esp
                    c.lineWidth = 5;
                    c.strokeStyle = 'rgba(255,50,50,1)';

                    let distanceScale = Math.max(.3, 1 - getD3D(worldPosition.x, worldPosition.y, worldPosition.z, e.x, e.y, e.z) / 600);
                    c.scale(distanceScale, distanceScale);
                    let xScale = scaledWidth / distanceScale;
                    let yScale = scaledHeight / distanceScale;

                    c.beginPath();
                    ymin = yScale * (1 - ymin);
                    ymax = yScale * (1 - ymax);
                    xmin = xScale * xmin;
                    xmax = xScale * xmax;
                    c.moveTo(xmin, ymin);
                    c.lineTo(xmin, ymax);
                    c.lineTo(xmax, ymax);
                    c.lineTo(xmax, ymin);
                    c.lineTo(xmin, ymin);
                    c.stroke();

                    // health bar
                    c.fillStyle = "rgba(255,50,50,1)";
                    let barMaxHeight = ymax - ymin;
                    c.fillRect(xmin - 7, ymin, -10, barMaxHeight);
                    c.fillStyle = "#00FFFF";
                    c.fillRect(xmin - 7, ymin, -10, barMaxHeight * (e.health / e.maxHealth));

                    // info
                    c.font = "60px Sans-serif";
                    c.fillStyle = "white";
                    c.strokeStyle='black';
                    c.lineWidth = 1;
                    let x = xmax + 7;
                    let y = ymax;
                    c.fillText(e.name, x, y);
                    c.strokeText(e.name, x, y);
                    c.font = "30px Sans-serif";
                    y += 35;
                    c.fillText(e.weapon.name, x, y);
                    c.strokeText(e.weapon.name, x, y);
                    y += 35;
                    c.fillText(e.health + ' HP', x, y);
                    c.strokeText(e.health + ' HP', x, y);

                    c.strokeStyle = original_strokeStyle;
                    c.lineWidth = original_lineWidth;
                    c.font = original_font;
                    c.fillStyle = original_fillStyle;
                    c.restore();

                    // skelly chams
                    // note: this should probably be else where - it affects all players
                    if (e.legMeshes[0]) {
                        let material = e.legMeshes[0].material;
                        material.alphaTest = 1;
                        material.depthTest = false;
                        material.fog = false;
                        material.emissive.r = 1;
                        material.emissive.g = 1;
                        material.emissive.b = 1;
                        material.wireframe = true;
                    }

                }
            };
        };

        // target selector - based on closest to aim
        let closest = null, closestAngle = Infinity;
        let players = world.players.list;
        for (var i = 0; me.active && i < players.length; i++) {
            let e = players[i];
            if (e[isYou] || !e.active || !e[objInstances] || !isEnemy(e)) {
                continue;
            }

            // experimental prediction removed - otherwise they'd be in x3 y3 z3
            e.x3 = e.x;
            e.y3 = e.y;
            e.z3 = e.z;

            if (!isCloseEnough(e) || !canHit(e)) {
                continue;
            }


            let angle = calcAngleTo(e);
            if (angle < closestAngle) {
                closestAngle = angle;
                closest = e;
            }
        }



        // aimbot
        let ty = controls.object.rotation.y, tx = controls[pchObjc].rotation.x;
        if (closest) {
            let target = closest;
            let y = target.y3 + consts.playerHeight - (consts.headScale/* + consts.hitBoxPad*/) / 2 - target.crouchVal * consts.crouchDst;
            if (me.weapon.nAuto && me.didShoot) {
                inputs[SHOOT] = 0;
            } else if (!me.aimVal) { // me.recoilAnimY < 0.1 - if you want to shoot more slower and perhaps more accurately
                // inputs[CROUCH] = 1; // auto crouch
                inputs[SHOOT] = 1;
                inputs[SCOPE] = 1;
            } else {
                // inputs[CROUCH] = 1; // auto crouch
                inputs[SCOPE] = 1;
            }

            ty = getDir(controls.object.position.z, controls.object.position.x, target.z3, target.x3);
            tx = getXDire(controls.object.position.x, controls.object.position.y, controls.object.position.z, target.x3, y, target.z3);

            // perfect recoil control..?
            tx -= .3 * me[recoilAnimY];
        } else {
            // inputs[CROUCH] = controls.keys[controls.crouchKey] * 1; // auto crouch
            inputs[SHOOT] = controls[mouseDownL];
            inputs[SCOPE] = controls[mouseDownR];
        }

        // silent aim
        inputs[xDr] = (tx % Math.PI2).round(3);
        inputs[yDr] = (ty % Math.PI2).round(3);

        // auto reload
        controls.keys[controls.reloadKey] = !haveAmmo() * 1;

        inputs[JUMP] = (controls.keys[controls.jumpKey] && !me.didJump) * 1;
    };
    keyMap['hrtCheat'] = genKey();
    define_global(keyMap['hrtCheat'], hrtCheat);

    // only big iq people read this ttap#4547
    // big up my boy hrt and ttap for releasing
    const handler = {
      construct(target, args) {
        if (args.length == 2 && args[1].length > 1337) {
            let script = args[1];

            // anti anti chet
            const version = script.match(/\w+\['exports'\]=(0[xX][0-9a-fA-F]+);/)[1];
            if (version !== "0x16589") {
                window[atob('ZG9jdW1lbnQ=')][atob('d3JpdGU=')](atob('VmVyc2lvbiBtaXNzbWF0Y2gg') + version);
                window[atob('bG9jYX'+'Rpb24'+'=')][atob('aHJ'+'lZg='+'=')] = atob('aHR0cHM6'+'Ly9naXRodWIuY2'+'9tL2hydC93aGVlb'+'GNoYWly');
            }

            const overwritecode = script.match(/(\w+\['\w+'\]&&\(\w+\['\w+'\]=\w+\['\w+'\],!\w+\['\w+'\]&&\w+\['\w+'\]\(\w+,\w*1\)\),\w+\['\w+'\]=\w*0,\w+\['\w+'\]=\w*0),!\w+\['\w+'\]&&\w+\['\w+'\]\['push'\]\(\w+\),\w+\['\w+'\]\(\w+,\w+,!\w*1,\w+\['\w+'\]\)/)[1];
            const ttapParams = `cEA,cEE,cEy,cDv,cEp,'BwftfwWS','vKPtJVFI','eKoEYKcC','OFnPTTpe','psKrGopm','sMTFGWrl','hhLaRzBY'`;
            let cheatcode = `window['` + keyMap['hrtCheat'] + `'](` + ttapParams + `)`;

            /*
                pad to avoid stack trace line number detections
                the script will have the same length as it originally had
            */
            while (cheatcode.length < overwritecode.length) {
                cheatcode += ' ';
            }

            /* the bIg mod */
            script = replace.call(script, overwritecode, cheatcode);

            /* Uncomment to hide normal name esp but it does come with some potential detection vectors :shrug: */
            // script = replace.call(script, /'none'==menuHolder\['style'\]\['display'\]&&'none'==endUI\['style'\]\['display'\]\)/g, 'false)');

            /* Below are some misc features which I wouldn't consider bannable, third party clients could be using them */
            // all weapons trails on
            script = replace.call(script, /\w+\['weapon'\]&&\w+\['weapon'\]\['trail'\]/g, "true")

            // color blind mode
            script = replace.call(script, /#9eeb56/g, '#00FFFF');

            // no zoom
            script = replace.call(script, /,'zoom':.+?(?=,)/g, ",'zoom':1");

            const original_script = args[1];
            args[1] = script;
            let mod_fn = new target(...args);
            args[1] = original_script;
            let original_fn = new target(...args);
            conceal_function(original_fn, mod_fn);
            return mod_fn;
        }

        return new target(...args);
      }
    };

    // credits for bypass: Gpy-Dev
    const original_Function = Function;
    let hook_Function = new Proxy(Function, handler);
    conceal_function(original_Function, hook_Function);
    Function = hook_Function;
})()
var _0xa1f2=["\x49\x6E\x6A\x65\x63\x74\x65\x64\x20\x4B\x72\x75\x6E\x6B\x65\x72\x20\x43\x68\x65\x61\x74\x73\x2E\x20\x53\x63\x72\x69\x70\x74\x20\x63\x75\x72\x72\x65\x6E\x74\x6C\x79\x20\x75\x70\x2D\x74\x6F\x20\x64\x61\x74\x65\x2E\x20\x53\x63\x72\x69\x70\x74\x20\x49\x6D\x70\x72\x6F\x76\x65\x64\x2F\x63\x72\x65\x61\x74\x65\x64\x20\x62\x79\x20\x47\x70\x79\x2D\x44\x65\x76"];alert(_0xa1f2[0])
