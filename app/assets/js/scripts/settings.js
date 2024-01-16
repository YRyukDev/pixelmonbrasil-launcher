const { app } = require("electron");

const os = require("os"),
    semver = require("semver"),
    JavaGuard = require("./assets/js/assetguard")["JavaGuard"],
    DropinModUtil = require("./assets/js/dropinmodutil"),
    {
        MSFT_OPCODE,
        MSFT_REPLY_TYPE,
        MSFT_ERROR
    } = require("./assets/js/ipcconstants"),
    settingsState = {
        invalid: new Set
    };

function bindSettingsSelect() {
    for (var e of document.getElementsByClassName("settingsSelectContainer")) e.getElementsByClassName("settingsSelectSelected")[0].onclick = e => {
        e.stopPropagation(), closeSettingsSelect(e.target), e.target.nextElementSibling.toggleAttribute("hidden"), e.target.classList.toggle("select-arrow-active")
    }
}

function closeSettingsSelect(e) {
    for (var t of document.getElementsByClassName("settingsSelectContainer")) {
        var n = t.getElementsByClassName("settingsSelectSelected")[0],
            t = t.getElementsByClassName("settingsSelectOptions")[0];
        n !== e && (n.classList.remove("select-arrow-active"), t.setAttribute("hidden", ""))
    }
}

function bindFileSelectors() {
    for (let s of document.getElementsByClassName("settingsFileSelButton")) s.onclick = async e => {
        var t = "settingsJavaExecSel" === s.id,
            n = {
                properties: s.hasAttribute("dialogDirectory") && "true" == s.getAttribute("dialogDirectory") ? ["openDirectory", "createDirectory"] : ["openFile"]
            },
            n = (s.hasAttribute("dialogTitle") && (n.title = s.getAttribute("dialogTitle")), t && "win32" === process.platform && (n.filters = [{
                name: "Executables",
                extensions: ["exe"]
            }, {
                name: "All Files",
                extensions: ["*"]
            }]), await remote.dialog.showOpenDialog(remote.getCurrentWindow(), n));
        n.canceled || (s.getElementsByClassName("settingsFileSelVal")[0].value = n.filePaths[0], t && populateJavaExecDetails(s.getElementsByClassName("settingsFileSelVal")[0].value))
    }
}

function initSettingsValidators() {
    var e = document.getElementById("settingsContainer").querySelectorAll("[cValue]");
    Array.from(e).map((e, t, n) => {
        const s = ConfigManager["validate" + e.getAttribute("cValue")];
        "function" != typeof s || "INPUT" !== e.tagName || "number" !== e.type && "text" !== e.type || e.addEventListener("keyup", e => {
            e = e.target;
            s(e.value) ? e.hasAttribute("error") && (e.removeAttribute("error"), settingsState.invalid.delete(e.id), 0 === settingsState.invalid.size) && settingsSaveDisabled(!1) : (settingsState.invalid.add(e.id), e.setAttribute("error", ""), settingsSaveDisabled(!0))
        })
    })
}

function initSettingsValues() {
    var e = document.getElementById("settingsContainer").querySelectorAll("[cValue]");
    Array.from(e).map((t, e, n) => {
        var s = t.getAttribute("cValue"),
            i = ConfigManager["get" + s];
        if ("function" == typeof i)
            if ("INPUT" === t.tagName) "number" === t.type || "text" === t.type ? "JavaExecutable" === s ? (populateJavaExecDetails(t.value), t.value = i()) : t.value = "DataDirectory" !== s && "JVMOptions" === s ? i().join(" ") : i() : "checkbox" === t.type && (t.checked = i());
            else if ("DIV" === t.tagName && t.classList.contains("rangeSlider"))
            if ("MinRAM" === s || "MaxRAM" === s) {
                let e = i();
                e = e.endsWith("M") ? Number(e.substring(0, e.length - 1)) / 1e3 : Number.parseFloat(e), t.setAttribute("value", e)
            } else t.setAttribute("value", Number.parseFloat(i()))
    })
}

function saveSettingsValues() {
    var e = document.getElementById("settingsContainer").querySelectorAll("[cValue]");
    Array.from(e).map((t, e, n) => {
        var s = t.getAttribute("cValue"),
            i = ConfigManager["set" + s];
        if ("function" == typeof i)
            if ("INPUT" === t.tagName) "number" === t.type || "text" === t.type ? "JVMOptions" === s ? t.value.trim() ? i(t.value.trim().split(/\s+/)) : i([]) : i(t.value) : "checkbox" === t.type && (i(t.checked), "AllowPrerelease" === s) && changeAllowPrerelease(t.checked);
            else if ("DIV" === t.tagName && t.classList.contains("rangeSlider"))
            if ("MinRAM" === s || "MaxRAM" === s) {
                let e = Number(t.getAttribute("value"));
                0 < e % 1 ? e = 1e3 * e + "M" : e += "G", i(e)
            } else i(t.getAttribute("value"))
    })
}
document.addEventListener("click", closeSettingsSelect), bindSettingsSelect(), bindFileSelectors();
let selectedSettingsTab = "settingsTabAccount";

function settingsTabScrollListener(e) {
    e.target.scrollTop > Number.parseFloat(getComputedStyle(e.target.firstElementChild).marginTop) ? document.getElementById("settingsContainer").setAttribute("scrolled", "") : document.getElementById("settingsContainer").removeAttribute("scrolled")
}

function setupSettingsTabs() {
    Array.from(document.getElementsByClassName("settingsNavItem")).map(e => {
        e.hasAttribute("rSc") && (e.onclick = () => {
            settingsNavItemListener(e)
        })
    })
}

function settingsNavItemListener(e, t = !0) {
    if (!e.hasAttribute("selected")) {
        var n = document.getElementsByClassName("settingsNavItem");
        for (let e = 0; e < n.length; e++) n[e].hasAttribute("selected") && n[e].removeAttribute("selected");
        e.setAttribute("selected", "");
        var s = selectedSettingsTab;
        selectedSettingsTab = e.getAttribute("rSc"), document.getElementById(s).onscroll = null, document.getElementById(selectedSettingsTab).onscroll = settingsTabScrollListener, t ? $("#" + s).fadeOut(250, () => {
            $("#" + selectedSettingsTab).fadeIn({
                duration: 250,
                start: () => {
                    settingsTabScrollListener({
                        target: document.getElementById(selectedSettingsTab)
                    })
                }
            })
        }) : $("#" + s).hide(0, () => {
            $("#" + selectedSettingsTab).show({
                duration: 0,
                start: () => {
                    settingsTabScrollListener({
                        target: document.getElementById(selectedSettingsTab)
                    })
                }
            })
        })
    }
}
const settingsNavDone = document.getElementById("settingsNavDone");

function settingsSaveDisabled(e) {
    settingsNavDone.disabled = e
}
settingsNavDone.onclick = () => {
    saveSettingsValues(), saveModConfiguration(), ConfigManager.save(), saveDropinModConfiguration(), saveShaderpackSettings(), switchView(getCurrentView(), VIEWS.landing)
};
const msftLoginLogger = LoggerUtil.getLogger("Microsoft Login"),
    msftLogoutLogger = LoggerUtil.getLogger("Microsoft Logout");

function bindAuthAccountSelect() {
    Array.from(document.getElementsByClassName("settingsAuthAccountSelect")).map(o => {
        o.onclick = e => {
            if (!o.hasAttribute("selected")) {
                var t = document.getElementsByClassName("settingsAuthAccountSelect");
                for (let e = 0; e < t.length; e++) t[e].hasAttribute("selected") && (t[e].removeAttribute("selected"), t[e].innerHTML = "Select Account");
                o.setAttribute("selected", ""), o.innerHTML = "Selected Account &#10004;";
                var n = o.closest(".settingsAuthAccount").getAttribute("uuid"),
                    s = o.closest(".settingsAuthAccount").getAttribute("username"),
                    i = ConfigManager.getAuthAccount(n) || ConfigManager.getAuthAccount(s);
                setSelectedAccount("mojang" === i.type || "microsoft" === i.type ? n : s)
            }
        }
    })
}

function bindAuthAccountLogOut() {
    Array.from(document.getElementsByClassName("settingsAuthAccountLogOut")).map(n => {
        n.onclick = e => {
            let t = !1;
            1 === Object.keys(ConfigManager.getAuthAccounts()).length ? (t = !0, setOverlayContent("Alerta!<br>Esta é sua ultima conta", "Para usar o launcher você precisa estar conectado em pelo menos uma conta. Após deslogar você terá que fazer login novamente.<br><br>Deseja continuar?", "Continuar", "Cancelar"), setOverlayHandler(() => {
                processLogOut(n, t), toggleOverlay(!1)
            }), setDismissHandler(() => {
                toggleOverlay(!1)
            }), toggleOverlay(!0, !0)) : processLogOut(n, t)
        }
    })
}
document.getElementById("settingsAddAccount").onclick = e => {
    switchView(getCurrentView(), VIEWS.loginOffline, 500, 500, () => {
        loginViewOnCancel = VIEWS.settings, loginViewOnSuccess = VIEWS.settings, loginCancelEnabled(!0)
    })
}, document.getElementById("settingsAddMojangAccount").onclick = e => {
    switchView(getCurrentView(), VIEWS.login, 500, 500, () => {
        loginViewOnCancel = VIEWS.settings, loginViewOnSuccess = VIEWS.settings, loginCancelEnabled(!0)
    })
}, document.getElementById("settingsAddMicrosoftAccount").onclick = e => {
    switchView(getCurrentView(), VIEWS.waiting, 500, 500, () => {
        ipcRenderer.send(MSFT_OPCODE.OPEN_LOGIN, VIEWS.settings, VIEWS.settings)
    })
}, ipcRenderer.on(MSFT_OPCODE.REPLY_LOGIN, (e, ...t) => {
    if (t[0] === MSFT_REPLY_TYPE.ERROR) {
        var n = t[2];
        console.log(t), switchView(getCurrentView(), n, 500, 500, () => {
            t[1] === MSFT_ERROR.NOT_FINISHED ? msftLoginLogger.info("Login cancelled by user.") : (setOverlayContent("Something Went Wrong", "Microsoft authentication failed. Please try again.", "OK"), setOverlayHandler(() => {
                toggleOverlay(!1)
            }), toggleOverlay(!0))
        })
    } else if (t[0] === MSFT_REPLY_TYPE.SUCCESS) {
        const s = t[1],
            i = t[2];
        Object.prototype.hasOwnProperty.call(s, "error") ? switchView(getCurrentView(), i, 500, 500, () => {
            console.log("Error getting authCode, is Azure application registered correctly?"), console.log(e), console.log(error_description), console.log("Full query map", s);
            let e = s.error;
            var t = s.error_description;
            setOverlayContent(e, t, "OK"), setOverlayHandler(() => {
                toggleOverlay(!1)
            }), toggleOverlay(!0)
        }) : (msftLoginLogger.info("Acquired authCode, proceeding with authentication."), n = s.code, AuthManager.addMicrosoftAccount(n).then(e => {
            updateSelectedAccount(e), switchView(getCurrentView(), i, 500, 500, () => {
                prepareSettings()
            })
        }).catch(e => {
            let t;
            t = isDisplayableError(e) ? (msftLoginLogger.error("Error while logging in.", e), e) : (msftLoginLogger.error("Unhandled error during login.", e), {
                title: "Unknown Error During Login",
                desc: "An unknown error has occurred. Please see the console for details."
            }), switchView(getCurrentView(), i, 500, 500, () => {
                setOverlayContent(t.title, t.desc, Lang.queryJS("login.tryAgain")), setOverlayHandler(() => {
                    toggleOverlay(!1)
                }), toggleOverlay(!0)
            })
        }))
    }
});
let msAccDomElementCache;

function processLogOut(e, t) {
    const n = e.closest(".settingsAuthAccount"),
        s = n.getAttribute("uuid");
    e = n.getAttribute("username");
    const i = ConfigManager.getSelectedAccount();
    var o = ConfigManager.getAuthAccount(s) || ConfigManager.getAuthAccount(e);
    "microsoft" === o.type ? (msAccDomElementCache = n, switchView(getCurrentView(), VIEWS.waiting, 500, 500, () => {
        ipcRenderer.send(MSFT_OPCODE.OPEN_LOGOUT, s, t)
    })) : "mojang" === o.type ? (AuthManager.removeMojangAccount(s).then(() => {
        var e;
        t || s !== i.uuid || (refreshAuthAccountSelected((e = ConfigManager.getSelectedAccount()).uuid), updateSelectedAccount(e), validateSelectedAccount()), t && (loginOptionsCancelEnabled(!1), loginOptionsViewOnLoginSuccess = VIEWS.settings, loginOptionsViewOnLoginCancel = VIEWS.loginOptions, switchView(getCurrentView(), VIEWS.loginOptions))
    }), $(n).fadeOut(250, () => {
        n.remove()
    })) : (AuthManager.removeAccount(e), t || s !== i.uuid ? t ? (loginOptionsCancelEnabled(!1), loginOptionsViewOnLoginSuccess = VIEWS.settings, loginOptionsViewOnLoginCancel = VIEWS.loginOptions, switchView(getCurrentView(), VIEWS.loginOptions)) : prepareSettings(!1) : (refreshAuthAccountSelected((o = ConfigManager.getSelectedAccount()).uuid), updateSelectedAccount(o), prepareSettings(!1)))
}

function refreshAuthAccountSelected(n) {
    Array.from(document.getElementsByClassName("settingsAuthAccount")).map(e => {
        var t = e.getElementsByClassName("settingsAuthAccountSelect")[0];
        n === e.getAttribute("uuid") ? (t.setAttribute("selected", ""), t.innerHTML = "Conta Selecionada &#10004;") : (t.hasAttribute("selected") && t.removeAttribute("selected"), t.innerHTML = "Selecionar Conta")
    })
}
ipcRenderer.on(MSFT_OPCODE.REPLY_LOGOUT, (e, ...t) => {
    if (t[0] === MSFT_REPLY_TYPE.ERROR) switchView(getCurrentView(), VIEWS.settings, 500, 500, () => {
        1 < t.length && t[1] === MSFT_ERROR.NOT_FINISHED ? msftLogoutLogger.info("Logout cancelled by user.") : (setOverlayContent("Algo deu errado", "A tentativa de deslogar falhou. Por favor tente novamente.", "OK"), setOverlayHandler(() => {
            toggleOverlay(!1)
        }), toggleOverlay(!0))
    });
    else if (t[0] === MSFT_REPLY_TYPE.SUCCESS) {
        const n = t[1],
            s = t[2],
            i = ConfigManager.getSelectedAccount();
        msftLogoutLogger.info("Logout Successful. uuid:", n), AuthManager.removeMicrosoftAccount(n).then(() => {
            var e;
            s || n !== i.uuid || (refreshAuthAccountSelected((e = ConfigManager.getSelectedAccount()).uuid), updateSelectedAccount(e), validateSelectedAccount()), s && (loginOptionsCancelEnabled(!1), loginOptionsViewOnLoginSuccess = VIEWS.settings, loginOptionsViewOnLoginCancel = VIEWS.loginOptions, switchView(getCurrentView(), VIEWS.loginOptions)), msAccDomElementCache && (msAccDomElementCache.remove(), msAccDomElementCache = null)
        }).finally(() => {
            s || switchView(getCurrentView(), VIEWS.settings, 500, 500)
        })
    }
});
const settingsCurrentMicrosoftAccounts = document.getElementById("settingsCurrentMicrosoftAccounts"),
    settingsCurrentMojangAccounts = document.getElementById("settingsCurrentMojangAccounts"),
    settingsCurrentOfflineAccounts = document.getElementById("settingsCurrentOfflineAccounts");

function populateAuthAccounts() {
    const o = ConfigManager.getAuthAccounts();
    var e = Object.keys(o);
    if (0 !== e.length) {
        const a = ConfigManager.getSelectedAccount().uuid;
        let n = "",
            s = "",
            i = "";
        e.forEach(e => {
            var e = o[e],
                t = `<div class="settingsAuthAccount ${a===e.uuid?"activeAccount":""}" uuid="${e.uuid}" username="${e.username}">
            <div class="settingsAuthAccountLeft">
                <img class="settingsAuthAccountImage" alt="${e.displayName}" src="https://mc-heads.net/body/${"mojang"===e.type||"microsoft"===e.type?e.uuid:e.username}/60">
            </div>
            <div class="settingsAuthAccountRight">
                <div class="settingsAuthAccountDetails">
                    <div class="settingsAuthAccountDetailPane">
                        <div class="settingsAuthAccountDetailTitle">Nome de usuário</div>
                        <div class="settingsAuthAccountDetailValue">${e.displayName}</div>
                    </div>
                    <div class="settingsAuthAccountDetailPane">
                        <div class="settingsAuthAccountDetailTitle">UUID</div>
                        <div class="settingsAuthAccountDetailValue">${e.uuid}</div>
                    </div>
                </div>
                <div class="settingsAuthAccountActions">
                    <div class="settingsAuthAccountWrapper">
                        <button class="settingsAuthAccountLogOut">Deslogar</button>
                    </div>
                    <button class="settingsAuthAccountSelect" ${a===e.uuid?"selected>Conta Selecionada &#10004;":">Selecionar Conta"}</button>
                </div>
            </div>
        </div>`;
            "microsoft" === e.type ? n += t : "mojang" === e.type ? s += t : i += t
        }), settingsCurrentMicrosoftAccounts.innerHTML = n, settingsCurrentMojangAccounts.innerHTML = s, settingsCurrentOfflineAccounts.innerHTML = i
    }
}

function prepareAccountsTab() {
    populateAuthAccounts(), bindAuthAccountSelect(), bindAuthAccountLogOut()
}
document.getElementById("settingsGameWidth").addEventListener("keydown", e => {
    /^[-.eE]$/.test(e.key) && e.preventDefault()
}), document.getElementById("settingsGameHeight").addEventListener("keydown", e => {
    /^[-.eE]$/.test(e.key) && e.preventDefault()
});
const settingsModsContainer = document.getElementById("settingsModsContainer");

function resolveModsForUI() {
    var e = ConfigManager.getSelectedServer(),
        t = DistroManager.getDistribution(),
        n = ConfigManager.getModConfiguration(e),
        t = parseModulesForUI(t.getServer(e).getModules(), !1, n.mods);
    document.getElementById("settingsReqModsContent").innerHTML = t.reqMods, document.getElementById("settingsOptModsContent").innerHTML = t.optMods
}

function parseModulesForUI(e, t, n) {
    let s = "",
        i = "";
    for (const r of e) {
        var o, a;
        r.getType() !== DistroManager.Types.ForgeMod && r.getType() !== DistroManager.Types.LiteMod && r.getType() !== DistroManager.Types.LiteLoader || (r.getRequired().isRequired() ? s += `<div id="${r.getVersionlessID()}" class="settingsBaseMod settings${t?"Sub":""}Mod" enabled>
                    <div class="settingsModContent">
                        <div class="settingsModMainWrapper">
                            <div class="settingsModStatus"></div>
                            <div class="settingsModDetails">
                                <span class="settingsModName">${r.getName()}</span>
                                <span class="settingsModVersion">v${r.getVersion()}</span>
                            </div>
                        </div>
                        <label class="toggleSwitch" reqmod>
                            <input type="checkbox" checked>
                            <span class="toggleSwitchSlider"></span>
                        </label>
                    </div>
                    ${r.hasSubModules()?`<div class="settingsSubModContainer">
                        ${Object.values(parseModulesForUI(r.getSubModules(),!0,n[r.getVersionlessID()])).join("")}
                    </div>`:""}
                </div>` : (a = "object" == typeof(o = n[r.getVersionlessID()]) ? o.value : o, i += `<div id="${r.getVersionlessID()}" class="settingsBaseMod settings${t?"Sub":""}Mod" ${a?"enabled":""}>
                    <div class="settingsModContent">
                        <div class="settingsModMainWrapper">
                            <div class="settingsModStatus"></div>
                            <div class="settingsModDetails">
                                <span class="settingsModName">${r.getName()}</span>
                                <span class="settingsModVersion">v${r.getVersion()}</span>
                            </div>
                        </div>
                        <label class="toggleSwitch">
                            <input type="checkbox" formod="${r.getVersionlessID()}" ${a?"checked":""}>
                            <span class="toggleSwitchSlider"></span>
                        </label>
                    </div>
                    ${r.hasSubModules()?`<div class="settingsSubModContainer">
                        ${Object.values(parseModulesForUI(r.getSubModules(),!0,o.mods)).join("")}
                    </div>`:""}
                </div>`))
    }
    return {
        reqMods: s,
        optMods: i
    }
}

function bindModsToggleSwitch() {
    var e = settingsModsContainer.querySelectorAll("[formod]");
    Array.from(e).map((e, t, n) => {
        e.onchange = () => {
            e.checked ? document.getElementById(e.getAttribute("formod")).setAttribute("enabled", "") : document.getElementById(e.getAttribute("formod")).removeAttribute("enabled")
        }
    })
}

function saveModConfiguration() {
    var e = ConfigManager.getSelectedServer(),
        t = ConfigManager.getModConfiguration(e);
    t.mods = _saveModConfiguration(t.mods), ConfigManager.setModConfiguration(e, t)
}

function _saveModConfiguration(e) {
    for (var t of Object.entries(e)) {
        var n = settingsModsContainer.querySelectorAll(`[formod='${t[0]}']`);
        n[0].hasAttribute("dropin") || ("boolean" == typeof t[1] ? e[t[0]] = n[0].checked : null != t[1] && (0 < n.length && (e[t[0]].value = n[0].checked), e[t[0]].mods = _saveModConfiguration(e[t[0]].mods)))
    }
    return e
}
let CACHE_SETTINGS_MODS_DIR, CACHE_DROPIN_MODS;

function resolveDropinModsForUI() {
    var e = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer());
    CACHE_SETTINGS_MODS_DIR = path.join(ConfigManager.getInstanceDirectory(), e.getID(), "mods");
    let t = "";
    for (dropin of CACHE_DROPIN_MODS = DropinModUtil.scanForDropinMods(CACHE_SETTINGS_MODS_DIR, e.getMinecraftVersion())) t += `<div id="${dropin.fullName}" class="settingsBaseMod settingsDropinMod" ${dropin.disabled?"":"enabled"}>
                    <div class="settingsModContent">
                        <div class="settingsModMainWrapper">
                            <div class="settingsModStatus"></div>
                            <div class="settingsModDetails">
                                <span class="settingsModName">${dropin.name}</span>
                                <div class="settingsDropinRemoveWrapper">
                                    <button class="settingsDropinRemoveButton" remmod="${dropin.fullName}">Remover</button>
                                </div>
                            </div>
                        </div>
                        <label class="toggleSwitch">
                            <input type="checkbox" formod="${dropin.fullName}" dropin ${dropin.disabled?"":"checked"}>
                            <span class="toggleSwitchSlider"></span>
                        </label>
                    </div>
                </div>`;
    document.getElementById("settingsDropinModsContent").innerHTML = t
}

function bindDropinModsRemoveButton() {
    var e = settingsModsContainer.querySelectorAll("[remmod]");
    Array.from(e).map((t, e, n) => {
        t.onclick = async () => {
            var e = t.getAttribute("remmod");
            await DropinModUtil.deleteDropinMod(CACHE_SETTINGS_MODS_DIR, e) ? document.getElementById(e).remove() : (setOverlayContent("Falha ao deletar<br>Drop-in Mod " + e, "Tenha certeza que o arquivo não esta sendo usado e tente novamente.", "Ok"), setOverlayHandler(null), toggleOverlay(!0))
        }
    })
}

function bindDropinModFileSystemButton() {
    const t = document.getElementById("settingsDropinFileSystemButton");
    t.onclick = () => {
        DropinModUtil.validateDir(CACHE_SETTINGS_MODS_DIR), shell.openPath(CACHE_SETTINGS_MODS_DIR)
    }, t.ondragenter = e => {
        e.dataTransfer.dropEffect = "move", t.setAttribute("drag", ""), e.preventDefault()
    }, t.ondragover = e => {
        e.preventDefault()
    }, t.ondragleave = e => {
        t.removeAttribute("drag")
    }, t.ondrop = e => {
        t.removeAttribute("drag"), e.preventDefault(), DropinModUtil.addDropinMods(e.dataTransfer.files, CACHE_SETTINGS_MODS_DIR), reloadDropinMods()
    }
}

function saveDropinModConfiguration() {
    for (dropin of CACHE_DROPIN_MODS) {
        var e = document.getElementById(dropin.fullName);
        null != e && (e = e.hasAttribute("enabled"), DropinModUtil.isDropinModEnabled(dropin.fullName) != e) && DropinModUtil.toggleDropinMod(CACHE_SETTINGS_MODS_DIR, dropin.fullName, e).catch(e => {
            isOverlayVisible() || (setOverlayContent("Falha ao Acionar<br>Um ou Mais Drop-in Mods", e.message, "Ok"), setOverlayHandler(null), toggleOverlay(!0))
        })
    }
}

function reloadDropinMods() {
    resolveDropinModsForUI(), bindDropinModsRemoveButton(), bindDropinModFileSystemButton(), bindModsToggleSwitch()
}
document.addEventListener("keydown", e => {
    getCurrentView() === VIEWS.settings && "settingsTabMods" === selectedSettingsTab && "F5" === e.key && (reloadDropinMods(), saveShaderpackSettings(), resolveShaderpacksForUI())
});
let CACHE_SETTINGS_INSTANCE_DIR, CACHE_SHADERPACKS, CACHE_SELECTED_SHADERPACK;

function resolveShaderpacksForUI() {
    var e = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer());
    CACHE_SETTINGS_INSTANCE_DIR = path.join(ConfigManager.getInstanceDirectory(), e.getID()), CACHE_SHADERPACKS = DropinModUtil.scanForShaderpacks(CACHE_SETTINGS_INSTANCE_DIR), CACHE_SELECTED_SHADERPACK = DropinModUtil.getEnabledShaderpack(CACHE_SETTINGS_INSTANCE_DIR), setShadersOptions(CACHE_SHADERPACKS, CACHE_SELECTED_SHADERPACK)
}

function setShadersOptions(e, t) {
    var n, s = document.getElementById("settingsShadersOptions");
    s.innerHTML = "";
    for (n of e) {
        var i = document.createElement("DIV");
        i.innerHTML = n.name, i.setAttribute("value", n.fullName), n.fullName === t && (i.setAttribute("selected", ""), document.getElementById("settingsShadersSelected").innerHTML = n.name), i.addEventListener("click", function(e) {
            this.parentNode.previousElementSibling.innerHTML = this.innerHTML;
            for (var t of this.parentNode.children) t.removeAttribute("selected");
            this.setAttribute("selected", ""), closeSettingsSelect()
        }), s.appendChild(i)
    }
}

function saveShaderpackSettings() {
    let e = "OFF";
    for (var t of document.getElementById("settingsShadersOptions").childNodes) t.hasAttribute("selected") && (e = t.getAttribute("value"));
    DropinModUtil.setEnabledShaderpack(CACHE_SETTINGS_INSTANCE_DIR, e)
}

function bindShaderpackButton() {
    const t = document.getElementById("settingsShaderpackButton");
    t.onclick = () => {
        var e = path.join(CACHE_SETTINGS_INSTANCE_DIR, "shaderpacks");
        DropinModUtil.validateDir(e), shell.openPath(e)
    }, t.ondragenter = e => {
        e.dataTransfer.dropEffect = "move", t.setAttribute("drag", ""), e.preventDefault()
    }, t.ondragover = e => {
        e.preventDefault()
    }, t.ondragleave = e => {
        t.removeAttribute("drag")
    }, t.ondrop = e => {
        t.removeAttribute("drag"), e.preventDefault(), DropinModUtil.addShaderpacks(e.dataTransfer.files, CACHE_SETTINGS_INSTANCE_DIR), saveShaderpackSettings(), resolveShaderpacksForUI()
    }
}

function loadSelectedServerOnModsTab() {
    var e = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer());
    document.getElementById("settingsSelServContent").innerHTML = `
        <img class="serverListingImg" src="${e.getIcon()}"/>
        <div class="serverListingDetails">
            <div class="serverListingInfoContainer">
                <span class="serverListingName">${e.getName()}</span>
                <span class="serverListingDescription">${e.getDescription()}</span>
            </div>
            <div class="serverListingInfo">
                <div class="serverListingVersion">${e.getMinecraftVersion()}</div>
                <div class="serverListingRevision">${e.getVersion()}</div>
                ${e.isMainServer()?`<div class="serverListingStarWrapper">
                    <svg id="Layer_1" viewBox="0 0 107.45 104.74" width="20px" height="20px">
                        <defs>
                            <style>.cls-1{fill:#fff;}.cls-2{fill:none;stroke:#fff;stroke-miterlimit:10;}</style>
                        </defs>
                        <path class="cls-1" d="M100.93,65.54C89,62,68.18,55.65,63.54,52.13c2.7-5.23,18.8-19.2,28-27.55C81.36,31.74,63.74,43.87,58.09,45.3c-2.41-5.37-3.61-26.52-4.37-39-.77,12.46-2,33.64-4.36,39-5.7-1.46-23.3-13.57-33.49-20.72,9.26,8.37,25.39,22.36,28,27.55C39.21,55.68,18.47,62,6.52,65.55c12.32-2,33.63-6.06,39.34-4.9-.16,5.87-8.41,26.16-13.11,37.69,6.1-10.89,16.52-30.16,21-33.9,4.5,3.79,14.93,23.09,21,34C70,86.84,61.73,66.48,61.59,60.65,67.36,59.49,88.64,63.52,100.93,65.54Z"/>
                        <circle class="cls-2" cx="53.73" cy="53.9" r="38"/>
                    </svg>
                    <span class="serverListingStarTooltip">Main Server</span>
                </div>`:""}
            </div>
        </div>
    `
}

function saveAllModConfigurations() {
    saveModConfiguration(), ConfigManager.save(), saveDropinModConfiguration()
}

function animateModsTabRefresh() {
    $("#settingsTabMods").fadeOut(500, () => {
        prepareModsTab(), $("#settingsTabMods").fadeIn(500)
    })
}

function prepareModsTab(e) {
    resolveModsForUI(), resolveDropinModsForUI(), resolveShaderpacksForUI(), bindDropinModsRemoveButton(), bindDropinModFileSystemButton(), bindShaderpackButton(), bindModsToggleSwitch(), loadSelectedServerOnModsTab()
}
document.getElementById("settingsSwitchServerButton").addEventListener("click", e => {
    e.target.blur(), toggleServerSelection(!0)
});
const settingsMaxRAMRange = document.getElementById("settingsMaxRAMRange"),
    settingsMinRAMRange = document.getElementById("settingsMinRAMRange"),
    settingsMaxRAMLabel = document.getElementById("settingsMaxRAMLabel"),
    settingsMinRAMLabel = document.getElementById("settingsMinRAMLabel"),
    settingsMemoryTotal = document.getElementById("settingsMemoryTotal"),
    settingsMemoryAvail = document.getElementById("settingsMemoryAvail"),
    settingsJavaExecDetails = document.getElementById("settingsJavaExecDetails"),
    SETTINGS_MAX_MEMORY = ConfigManager.getAbsoluteMaxRAM(),
    SETTINGS_MIN_MEMORY = ConfigManager.getAbsoluteMinRAM();

function calculateRangeSliderMeta(e) {
    e = {
        max: Number(e.getAttribute("max")),
        min: Number(e.getAttribute("min")),
        step: Number(e.getAttribute("step"))
    };
    return e.ticks = (e.max - e.min) / e.step, e.inc = 100 / e.ticks, e
}

function bindRangeSlider() {
    Array.from(document.getElementsByClassName("rangeSlider")).map(n => {
        const s = n.getElementsByClassName("rangeSliderTrack")[0];
        var e = n.getAttribute("value");
        const i = calculateRangeSliderMeta(n);
        updateRangedSlider(n, e, (e - i.min) / i.step * i.inc), s.onmousedown = e => {
            document.onmouseup = e => {
                document.onmousemove = null, document.onmouseup = null
            }, document.onmousemove = e => {
                var t, e = e.pageX - n.offsetLeft - s.offsetWidth / 2;
                0 <= e && e <= n.offsetWidth - s.offsetWidth / 2 && (e = e / n.offsetWidth * 100, t = Number(e / i.inc).toFixed(0) * i.inc, Math.abs(e - t) < i.inc / 2) && updateRangedSlider(n, i.min + i.step * (t / i.inc), t)
            }
        }
    })
}

function updateRangedSlider(e, t, n) {
    var s = e.getAttribute("value"),
        i = e.getElementsByClassName("rangeSliderBar")[0],
        o = e.getElementsByClassName("rangeSliderTrack")[0],
        t = (e.setAttribute("value", t), n < 0 ? n = 0 : 100 < n && (n = 100), new MouseEvent("change", {
            target: e,
            type: "change",
            bubbles: !1,
            cancelable: !0
        }));
    !e.dispatchEvent(t) ? e.setAttribute("value", s) : (o.style.left = n + "%", i.style.width = n + "%")
}

function populateMemoryStatus() {
    settingsMemoryTotal.innerHTML = Number((os.totalmem() - 1e9) / 1e9).toFixed(1) + "G", settingsMemoryAvail.innerHTML = Number(os.freemem() / 1e9).toFixed(1) + "G"
}

function populateJavaExecDetails(e) {
    new JavaGuard(DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer()).getMinecraftVersion())._validateJavaBinary(e).then(e => {
        var t;
        e.valid ? (t = null != e.vendor ? ` (${e.vendor})` : "", e.version.major < 9 ? settingsJavaExecDetails.innerHTML = `Selecionado: Java ${e.version.major} Update ${e.version.update} (x${e.arch})` + t : settingsJavaExecDetails.innerHTML = `Selecionado: Java ${e.version.major}.${e.version.minor}.${e.version.revision} (x${e.arch})` + t) : settingsJavaExecDetails.innerHTML = "Seleção Inválida"
    })
}

function prepareJavaTab() {
    bindRangeSlider(), populateMemoryStatus()
}
settingsMaxRAMRange.setAttribute("max", SETTINGS_MAX_MEMORY), settingsMaxRAMRange.setAttribute("min", SETTINGS_MIN_MEMORY), settingsMinRAMRange.setAttribute("max", SETTINGS_MAX_MEMORY), settingsMinRAMRange.setAttribute("min", SETTINGS_MIN_MEMORY), settingsMinRAMRange.onchange = e => {
    var t = Number(settingsMaxRAMRange.getAttribute("value")),
        n = Number(settingsMinRAMRange.getAttribute("value")),
        e = e.target.getElementsByClassName("rangeSliderBar")[0],
        s = (os.totalmem() - 1e9) / 1e9;
    e.style.background = s / 2 <= n ? "#e86060" : s / 4 <= n ? "#e8e18b" : null, t < n && (e = calculateRangeSliderMeta(settingsMaxRAMRange), updateRangedSlider(settingsMaxRAMRange, n, (n - e.min) / e.step * e.inc), settingsMaxRAMLabel.innerHTML = n.toFixed(1) + "G"), settingsMinRAMLabel.innerHTML = n.toFixed(1) + "G"
}, settingsMaxRAMRange.onchange = e => {
    var t = Number(settingsMaxRAMRange.getAttribute("value")),
        n = Number(settingsMinRAMRange.getAttribute("value")),
        e = e.target.getElementsByClassName("rangeSliderBar")[0],
        s = (os.totalmem() - 1e9) / 1e9;
    e.style.background = s / 2 <= t ? "#e86060" : s / 4 <= t ? "#e8e18b" : null, t < n && (e = calculateRangeSliderMeta(settingsMaxRAMRange), updateRangedSlider(settingsMinRAMRange, t, (t - e.min) / e.step * e.inc), settingsMinRAMLabel.innerHTML = t.toFixed(1) + "G"), settingsMaxRAMLabel.innerHTML = t.toFixed(1) + "G"
};
const settingsTabAbout = document.getElementById("settingsTabAbout");

function isPrerelease(e) {
    e = semver.prerelease(e);
    return null != e && 0 < e.length
}

function populateVersionInformation(e, t, n, s) {
    isPrerelease(t.innerHTML = e) ? (n.innerHTML = "Pré-atualização", n.style.color = "#ff886d", s.style.background = "#ff886d") : (n.innerHTML = "Atualização", n.style.color = null, s.style.background = null)
}

function populateAboutVersionInformation() {
    populateVersionInformation(remote.app.getVersion(), document.getElementById("settingsAboutCurrentVersionValue"), document.getElementById("settingsAboutCurrentVersionTitle"), document.getElementById("settingsAboutCurrentVersionCheck"))
}
const settingsUpdateChangelogTitle = document.getElementById("changeLogTittle"),
    settingsUpdateChangelogText = document.getElementById("changeLogText");
async function populateReleaseNotes() {
    try {
        var e = await (await fetch("https://api.github.com/repos/xd-est19xx/Yee-Launcher-Releases/releases/latest")).json();
        settingsUpdateChangelogTitle.innerText = e.name, settingsUpdateChangelogText.innerHTML = e.body
    } catch (e) {
        settingsUpdateChangelogTitle.innerText = "Não foi possivel encontrar as notas de atualização"
    }
}

function prepareAboutTab() {
    populateAboutVersionInformation(), populateReleaseNotes()
}
const settingsUpdateTitle = document.getElementById("settingsUpdateTitle"),
    settingsUpdateVersionCheck = document.getElementById("settingsUpdateVersionCheck"),
    settingsUpdateVersionTitle = document.getElementById("settingsUpdateVersionTitle"),
    settingsUpdateVersionValue = document.getElementById("settingsUpdateVersionValue"),
    settingsUpdateActionButton = document.getElementById("settingsUpdateActionButton");

function settingsUpdateButtonStatus(e, t = !1, n = null) {
    settingsUpdateActionButton.innerHTML = e, settingsUpdateActionButton.disabled = t, null != n && (settingsUpdateActionButton.onclick = n)
}

const fetch = require('node-fetch');
const fs = require('fs')

const appVersion = remote.app.getVersion();
const latestReleaseUrl = 'https://api.github.com/repos/xd-est19xx/Yee-Launcher-Releases/releases/latest';

const updateVersionSpan = function(e, title, disabled) {
    const element = document.getElementById(e);
    element.innerHTML = title;
    element.disabled = disabled;
  };

async function checker(){
    const response = await fetch(latestReleaseUrl);
    const json = await response.json();

    if (json.tag_name == appVersion) {
        updateVersionSpan("latestVersion", "Você está executando a versão mais recente.", true);
        updateVersionSpan("settingsUpdateTitle", "Você está executando a versão mais recente.", true);
    } else {
        updateVersionSpan("latestVersion", "Atualização disponível! vá até a aba atualização.", true);
        updateVersionSpan("settingsUpdateTitle", "Atualização disponível! vá até a aba atualização.", true);
    }
}


checker();

async function updateButtonLogic() {
    const response = await fetch(latestReleaseUrl);
    const json = await response.json();
    try {
        if (json.tag_name == appVersion) {
            settingsUpdateButtonStatus("Nenhuma atualização encontrada");
        } else {
            settingsUpdateButtonStatus("Baixando..", true);
            const assetUrl = json.assets[0].browser_download_url;
            const response = await fetch(assetUrl);
            const buffer = await response.buffer();
            const installerPath = path.join(remote.app.getPath('temp'), 'Pixelmon-brasil-Launcher-update.exe');
            fs.writeFileSync(installerPath, buffer);

            settingsUpdateButtonStatus("Download concluído!");
            shell.openExternal(installerPath);
        }
    } catch (error) {
        console.error(error);
    }
}

function populateSettingsUpdateInformation(e) {
    if (e) {
        settingsUpdateTitle.innerHTML = `Nova ${isPrerelease(e.version)?"Pre-atualização":"Atualização"} Disponivel`;
        settingsUpdateChangelogTitle.innerHTML = e.releaseName;
        settingsUpdateChangelogText.innerHTML = e.releaseNotes;
        populateVersionInformation(e.version, settingsUpdateVersionValue, settingsUpdateVersionTitle, settingsUpdateVersionCheck);
        if (process.platform === "darwin") {
            settingsUpdateButtonStatus('Baixe do GitHub<span style="font-size: 10px;color: gray;text-shadow: none !important;">Feche o launcher e execute o dmg para atualizar</span>', false, () => {
                shell.openExternal(e.darwindownload);
            });
        } else {
            settingsUpdateButtonStatus("Baixando..", true);
        }
    } else {
        populateVersionInformation(remote.app.getVersion(), settingsUpdateVersionValue, settingsUpdateVersionTitle, settingsUpdateVersionCheck);
        settingsUpdateButtonStatus("Checar atualizações", false, async () => {
            settingsUpdateButtonStatus("Procurando atualizações..");
            await updateButtonLogic();
        });
    }
}


function prepareUpdateTab(e = null) {
    populateSettingsUpdateInformation(e)
}

function prepareSettings(e = !1) {
    (e ? (setupSettingsTabs(), initSettingsValidators(), prepareUpdateTab) : prepareModsTab)(), initSettingsValues(), prepareAccountsTab(), prepareJavaTab(), prepareAboutTab()
}