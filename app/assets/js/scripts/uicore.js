const $ = require("jquery"),
    {
        ipcRenderer,
        shell,
        webFrame
    } = require("electron"),
    remote = require("@electron/remote"),
    isDev = require("./assets/js/isdev"),
    LoggerUtil = require("helios-core")["LoggerUtil"],
    LoggerUtil1 = require("./assets/js/loggerutil"),
    loggerUICore = LoggerUtil1("%c[UICore]", "color: #000668; font-weight: bold"),
    loggerAutoUpdater = LoggerUtil1("%c[AutoUpdater]", "color: #000668; font-weight: bold"),
    loggerAutoUpdaterSuccess = LoggerUtil1("%c[AutoUpdater]", "color: #209b07; font-weight: bold");
process.traceProcessWarnings = !0, process.traceDeprecation = !0, window.eval = global.eval = function() {
    throw new Error("Sorry, this app does not support window.eval().")
}, remote.getCurrentWebContents().on("devtools-opened", () => {
    console.log("%cThe console is dark and full of terrors.", "color: white; -webkit-text-stroke: 4px #a02d2a; font-size: 60px; font-weight: bold"), console.log("%cIf you've been told to paste something here, you're being scammed.", "font-size: 16px"), console.log("%cUnless you know exactly what you're doing, close this window.", "font-size: 16px")
}), webFrame.setZoomLevel(0), webFrame.setVisualZoomLevelLimits(1, 1);
let updateCheckListener;

function changeAllowPrerelease(e) {
    ipcRenderer.send("autoUpdateAction", "allowPrereleaseChange", e)
}

function showUpdateUI(e) {}
isDev || ipcRenderer.on("autoUpdateNotification", (e, t, o) => {
    switch (t) {
        case "checking-for-update":
            loggerAutoUpdater.log("Checking for update.."), settingsUpdateButtonStatus("Checando atualizações..", !0);
            break;
        case "update-available":
            loggerAutoUpdaterSuccess.log("Novas atualizações disponiveis", o.version), "darwin" === process.platform && (o.darwindownload = `https://github.com/dscalzi/HeliosLauncher/releases/download/v${o.version}/Helios-Launcher-setup-${o.version}${"arm64"===process.arch?"-arm64":"-x64"}.dmg`, showUpdateUI(o)), populateSettingsUpdateInformation(o);
            break;
        case "update-downloaded":
            loggerAutoUpdaterSuccess.log("Update " + o.version + " ready to be installed."), settingsUpdateButtonStatus("Instalar agora", !1, () => {
                isDev || ipcRenderer.send("autoUpdateAction", "installUpdateNow")
            }), showUpdateUI(o);
            break;
        case "update-not-available":
            loggerAutoUpdater.log("No new update found."), settingsUpdateButtonStatus("Checar atualizações");
            break;
        case "ready":
            updateCheckListener = setInterval(() => {
                ipcRenderer.send("autoUpdateAction", "checkForUpdate")
            }, 18e5), ipcRenderer.send("autoUpdateAction", "checkForUpdate");
            break;
        case "realerror":
            null != o && null != o.code && ("ERR_UPDATER_INVALID_RELEASE_FEED" === o.code ? loggerAutoUpdater.log("No suitable releases found.") : "ERR_XML_MISSED_ELEMENT" === o.code ? loggerAutoUpdater.log("No releases found.") : (loggerAutoUpdater.error("Error during update check..", o), loggerAutoUpdater.debug("Error Code:", o.code)));
            break;
        default:
            loggerAutoUpdater.log("Unknown argument", t)
    }
}), document.addEventListener("readystatechange", function() {
    "interactive" === document.readyState ? (loggerUICore.log("UICore Initializing.."), Array.from(document.getElementsByClassName("fCb")).map(e => {
        e.addEventListener("click", e => {
            remote.getCurrentWindow().close()
        })
    }), Array.from(document.getElementsByClassName("fRb")).map(e => {
        e.addEventListener("click", e => {
            var t = remote.getCurrentWindow();
            t.isMaximized() ? t.unmaximize() : t.maximize(), document.activeElement.blur()
        })
    }), Array.from(document.getElementsByClassName("fMb")).map(e => {
        e.addEventListener("click", e => {
            remote.getCurrentWindow().minimize(), document.activeElement.blur()
        })
    }), Array.from(document.getElementsByClassName("mediaURL")).map(e => {
        e.addEventListener("click", e => {
            document.activeElement.blur()
        })
    })) : document.readyState
}, !1), $(document).on("click", 'a[href^="http"]', function(e) {
    e.preventDefault(), shell.openExternal(this.href)
}), document.addEventListener("keydown", function(e) {
    ("I" === e.key || "i" === e.key) && e.ctrlKey && e.shiftKey && remote.getCurrentWindow().toggleDevTools()
});