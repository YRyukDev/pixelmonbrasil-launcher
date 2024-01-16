const cp = require("child_process");
const AdmZip = require('adm-zip'),
    crypto = require("crypto"),
    URL = require("url")["URL"],
    {
        MojangRestAPI,
        getServerStatus
    } = require("helios-core/mojang"),
    DiscordWrapper = require("./assets/js/discordwrapper"),
    ProcessBuilder = require("./assets/js/processbuilder"),
    {
        RestResponseStatus,
        isDisplayableError
    } = require("helios-core/common"),
    BrowserWindow = require("@electron/remote")["BrowserWindow"],
    data = require("jquery")["data"],
    launch_content = document.getElementById("launch_content"),
    launch_details = document.getElementById("launch_details"),
    launch_progress = document.getElementById("launchProgressBar"),
    launch_progress_label = document.getElementById("launchProgressBarLabel"),
    launchDetailsContainer = document.getElementById("launchDetailsContainer"),
    launch_button = document.getElementById("launch_button"),
    launch_details_text = document.getElementById("launchProgressBarDetails"),
    loggerLanding = LoggerUtil1("%c[Landing]", "color: #000668; font-weight: bold"),
    usernameText = document.getElementById("usernameText"),
    userMcHead = document.getElementById("userMcHead"),
    settingsButton = document.getElementById("settingsButton");
let rpcFlag = !(settingsButton.onclick = e => {
    prepareSettings(), switchView(getCurrentView(), VIEWS.settings, 500, 500, () => {
        settingsNavItemListener(document.getElementById("settingsNavAccount"), !1)
    })
});

function updateSelectedUser(e) {
    let a = "Nenhuma Conta Selecionada";
    null != e && (null != e.displayName && (a = e.displayName), userMcHead.src = "https://mc-heads.net/head/" + e.displayName, usernameText.textContent = a), usernameText.innerHTML = a, rpcFlag ? DiscordWrapper.updateUsername(e.displayName) : (DiscordWrapper.initRPC(a), rpcFlag = !0)
}

function toggleLaunchButton(e) {
    launch_button.disabled = !e
}

function toggleLaunchArea(e) {
    e ? (launchDetailsContainer.style.display = "flex", launch_button.style.display = "none") : (launchDetailsContainer.style.display = "none", launch_button.style.display = "initial")
}

function setLaunchDetails(e) {
    launch_details_text.innerHTML = e
}

function setLaunchPercentage(e, a, t = e / a * 100) {
    launch_progress.setAttribute("max", a), launch_progress.setAttribute("value", e), launch_progress_label.innerHTML = t + "%"
}

function setDownloadPercentage(e, a, t = e / a * 100) {
    remote.getCurrentWindow().setProgressBar(e / a), setLaunchPercentage(e, a, t)
}

function setLaunchEnabled(e) {
    document.getElementById("launch_button").disabled = !e
}

function updateSelectedAccount(e) {
    let a = "Nenhuma Conta Selecionada";
    null != e && (null != e.displayName && (a = e.displayName), null != e.uuid) && (userMcHead.src = "https://mc-heads.net/head/" + e.displayName), usernameText.innerHTML = a
}

function updateSelectedServer(e) {
    getCurrentView() === VIEWS.settings && saveAllModConfigurations(), ConfigManager.setSelectedServer(null != e ? e.getID() : null), ConfigManager.save(), getCurrentView() === VIEWS.settings && animateModsTabRefresh(), setLaunchEnabled(null != e)
}

function showLaunchFailure(e, a) {
    setOverlayContent(e, a, "Okay"), setOverlayHandler(null), toggleOverlay(!0), toggleLaunchArea(!1)
}
updateSelectedUser(ConfigManager.getSelectedAccount()), document.getElementById("launch_button").addEventListener("click", function(e) {
    loggerLanding.log("Launching game..");
    const a = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer()).getMinecraftVersion();
    var t = ConfigManager.getJavaExecutable();
    null == t ? asyncSystemScan(a) : (setLaunchDetails(Lang.queryJS("landing.launch.pleaseWait")), toggleLaunchArea(!0), setLaunchPercentage(0, 100), new JavaGuard(a)._validateJavaBinary(t).then(e => {
        loggerLanding.log("Java version meta", e), e.valid ? dlAsync() : asyncSystemScan(a)
    }))
}), document.getElementById("userInfoContainer").onclick = e => {
    prepareSettings(), switchView(getCurrentView(), VIEWS.settings)
}, updateSelectedAccount(ConfigManager.getSelectedAccount());
let logWindow, logsData = "";

function showLogWindow() {
    logWindow && logWindow.close(), (logWindow = new BrowserWindow({
        title: "Crash Logs",
        backgroundColor: "#0c0c0c",
        frame: !0
    })).on("closed", () => {
        logWindow = null, logsData = ""
    }), logWindow.removeMenu(), logWindow.setBackgroundColor("#ffffff"), logWindow.loadFile("./app/logs.ejs");
    var e = "setLogs(`" + logsData.trim().replace(/\\/g, "\\\\") + "`);";
    logWindow.webContents.executeJavaScript(e), logWindow.show()
}
let sysAEx, scanAt, extractListener;

function asyncSystemScan(e, t = !0) {
    setLaunchDetails("Please wait.."), toggleLaunchArea(!0), setLaunchPercentage(0, 100);
    const a = LoggerUtil1("%c[SysAEx]", "color: #353232; font-weight: bold");
    var n = JSON.parse(JSON.stringify(process.env));
    n.CONFIG_DIRECT_PATH = ConfigManager.getLauncherDirectory(), (sysAEx = cp.fork(path.join(__dirname, "assets", "js", "assetexec.js"), ["JavaGuard", e], {
        env: n,
        stdio: "pipe"
    })).stdio[1].setEncoding("utf8"), sysAEx.stdio[1].on("data", e => {
        a.log(e)
    }), sysAEx.stdio[2].setEncoding("utf8"), sysAEx.stdio[2].on("data", e => {
        a.log(e)
    }), sysAEx.on("message", e => {
        if ("validateJava" === e.context) null == e.result ? (setOverlayContent("Nenhum JAVA compativel foi encontrado.", "Para jogar você precisa de uma instalação x64 do JAVA 8, gostaria de instalar?", "Instalar Java", "Instalar Manualmente"), setOverlayHandler(() => {
            setLaunchDetails("Iniciando download do Java"), sysAEx.send({
                task: "changeContext",
                class: "AssetGuard",
                args: [ConfigManager.getCommonDirectory(), ConfigManager.getJavaExecutable()]
            }), sysAEx.send({
                task: "execute",
                function: "_enqueueOpenJDK",
                argsArr: [ConfigManager.getDataDirectory()]
            }), toggleOverlay(!1)
        }), setDismissHandler(() => {
            $("#overlayContent").fadeOut(250, () => {
                setOverlayContent("O Java é obrigatório<br>para jogar", "Uma instalação do java 8 x64 é necessária.<br>", "Entendi", "Voltar"), setOverlayHandler(() => {
                    toggleLaunchArea(!1), toggleOverlay(!1)
                }), setDismissHandler(() => {
                    toggleOverlay(!1, !0), asyncSystemScan()
                }), $("#overlayContent").fadeIn(250)
            })
        }), toggleOverlay(!0, !0)) : (ConfigManager.save(), settingsJavaExecVal.value = e.result, populateJavaExecDetails(settingsJavaExecVal.value), t && dlAsync(), sysAEx.disconnect());
        else if ("_enqueueOpenJDK" === e.context) !0 === e.result ? (setLaunchDetails("Baixando o Java.."), sysAEx.send({
            task: "execute",
            function: "processDlQueues",
            argsArr: [
                [{
                    id: "java",
                    limit: 1
                }]
            ]
        })) : (setOverlayContent("Erro inesperado:<br>Download do JAVA falhou.", "Infelizmente não conseguimos instalar o java, será necessário realizar uma instalação manual.", "Entendi"), setOverlayHandler(() => {
            toggleOverlay(!1), toggleLaunchArea(!1)
        }), toggleOverlay(!0), sysAEx.disconnect());
        else if ("progress" === e.context) "download" === e.data && setDownloadPercentage(e.value, e.total, e.percent);
        else if ("complete" === e.context) switch (e.data) {
            case "download": {
                remote.getCurrentWindow().setProgressBar(2);
                const a = "Extraindo";
                let e = "";
                setLaunchDetails(a), extractListener = setInterval(() => {
                    3 <= e.length ? e = "" : e += ".", setLaunchDetails(a + e)
                }, 750);
                break
            }
            case "java":
                remote.getCurrentWindow().setProgressBar(-1), ConfigManager.setJavaExecutable(e.args[0]), ConfigManager.save(), null != extractListener && (clearInterval(extractListener), extractListener = null), setLaunchDetails("Java Instalado!"), t && dlAsync(), sysAEx.disconnect()
        } else "error" === e.context && console.log(e.error)
    }), setLaunchDetails("Checando informações do sistema.."), sysAEx.send({
        task: "execute",
        function: "validateJava",
        argsArr: []
    })
}

let proc, hasRPC = !0;
const GAME_JOINED_REGEX = /\[.+\]: Sound engine started/,
    GAME_LAUNCH_REGEX = /^\[.+\]: (?:MinecraftForge .+ Initialized|ModLauncher .+ starting: .+)$/,
    MIN_LINGER = 5e3;
let aEx, serv, versionData, forgeData, progressListener;

function dlAsync(c = !0) {
    if (c && null == ConfigManager.getSelectedAccount()) loggerLanding.error("Você deve estar conectado em uma conta.");
    else {
        setLaunchDetails("Aguarde.."), toggleLaunchArea(!0), setLaunchPercentage(0, 100);
        const a = LoggerUtil1("%c[AEx]", "color: #353232; font-weight: bold"),
            d = LoggerUtil1("%c[LaunchSuite]", "color: #000668; font-weight: bold");
        var e = JSON.parse(JSON.stringify(process.env));
        e.CONFIG_DIRECT_PATH = ConfigManager.getLauncherDirectory(), (aEx = cp.fork(path.join(__dirname, "assets", "js", "assetexec.js"), ["AssetGuard", ConfigManager.getCommonDirectory(), ConfigManager.getJavaExecutable()], {
            env: e,
            stdio: "pipe"
        })).stdio[1].setEncoding("utf8"), aEx.stdio[1].on("data", e => {
            a.log(e)
        }), aEx.stdio[2].setEncoding("utf8"), aEx.stdio[2].on("data", e => {
            a.log(e)
        }), aEx.on("error", e => {
            d.error("Error during launch", e), showLaunchFailure("Erro durante a inicialização", e.message || "Tente novamente. Se o erro persistir, abra um ticket em nosso Discord.")
        }), aEx.on("close", (e, a) => {
            0 !== e && (d.error(`AssetExec exited with code ${e}, assuming error.`), showLaunchFailure("Tente novamente. Se o erro persistir, abra um ticket em nosso Discord."))
        }), aEx.on("message", a => {
            if ("validate" === a.context) switch (a.data) {
                case "distribution":
                    setLaunchPercentage(20, 100), d.log("Validated distibution index."), setLaunchDetails("Carregando informações da versão..");
                    break;
                case "version":
                    setLaunchPercentage(40, 100), d.log("Version data loaded."), setLaunchDetails("Validando integridade dos recursos..");
                    break;
                case "assets":
                    setLaunchPercentage(60, 100), d.log("Asset Validation Complete"), setLaunchDetails("Validando integridade das bibliotecas..");
                    break;
                case "libraries":
                    setLaunchPercentage(80, 100), d.log("Library validation complete."), setLaunchDetails("Validando integridade dos arquivos variados..");
                    break;
                case "files":
                    setLaunchPercentage(100, 100), d.log("File validation complete."), setLaunchDetails("Baixando arquivos..")
            } else if ("progress" === a.context) switch (a.data) {
                    case "assets":
                        var e = a.value / a.total * 20;
                        setLaunchPercentage(40 + e, 100, parseInt(40 + e));
                        break;
                    case "download":
                        setDownloadPercentage(a.value, a.total, a.percent);
                        break;
                    case "extract": {
                        remote.getCurrentWindow().setProgressBar(2);
                        const r = "Extraindo bibliotecas";
                        let e = "";
                        setLaunchDetails(r), progressListener = setInterval(() => {
                            3 <= e.length ? e = "" : e += ".", setLaunchDetails(r + e)
                        }, 750);
                        break
                    }
                } else if ("complete" === a.context) "download" === a.data && (remote.getCurrentWindow().setProgressBar(-1), null != progressListener && (clearInterval(progressListener), progressListener = null), setLaunchDetails("Preparando para iniciar.."));
                else if ("error" === a.context) "download" === a.data && (d.error("Error while downloading:", a.error), "ENOENT" === a.error.code ? showLaunchFailure("Erro no Download", "Não foi possivel conectar ao servidor de arquivos. Certifique-se de que você está conectado a internet e tente novamente.") : showLaunchFailure("Erro no Download", "Tente novamente. Se o erro persistir, abra um ticket em nosso Discord."), remote.getCurrentWindow().setProgressBar(-1), aEx.disconnect());
            else if ("validateEverything" === a.context) {
                let e = !0;
                if (null != a.result.forgeData && null != a.result.versionData || (d.error("Error during validation:", a.result), d.error("Error during launch", a.result.error), showLaunchFailure("Erro durante a inicialização", "Tente novamente. Se o erro persistir, abra um ticket em nosso Discord."), e = !1), forgeData = a.result.forgeData, versionData = a.result.versionData, c && e) {
                    var t = ConfigManager.getSelectedAccount(),
                        n = (d.log(`Sending selected account (${t.displayName}) to ProcessBuilder.`), new ProcessBuilder(serv, versionData, forgeData, t, remote.app.getVersion()));
                    setLaunchDetails("Iniciando o jogo.."), new RegExp(`\\[.+\\]: \\[CHAT\\] ${t.displayName} joined the game`);
                    const o = () => {
                            toggleLaunchArea(!1), toggleLaunchButton(!1), proc.stdout.removeListener("data", i), proc.stderr.removeListener("data", l)
                        },
                        s = Date.now(),
                        i = function(e) {
                            logsData += "\n" + e.trim(), GAME_LAUNCH_REGEX.test(e.trim()) && ((e = Date.now() - s) < MIN_LINGER ? setTimeout(o, MIN_LINGER - e) : o())
                        },
                        l = function(e) {
                            -1 < (e = e.trim()).indexOf("Could not find or load main class net.minecraft.launchwrapper.Launch") && (d.error("Game launch failed, LaunchWrapper was not downloaded properly."), showLaunchFailure("Erro durante a inicialização", "Não foi possivel baixar o arquivo principal corretamente. Como resultado, o jogo não foi inicializado.<br><br>Para resolver esse problema, desative temporariamente seu antivirus e inicie o jogo novamente."))
                        };
                    try {
                        (proc = n.build()).stdout.on("data", i), proc.stderr.on("data", l), setLaunchDetails("Pronto. Divirta-se!"), proc.on("close", (e, a) => {
                            toggleLaunchButton(!0), 0 != e && showLogWindow()
                        })
                    } catch (e) {
                        d.error("Error during launch", e), showLaunchFailure("Erro durante a inicialização", "Tente novamente. Se o erro persistir, abra um ticket em nosso Discord.")
                    }
                }
                aEx.disconnect()
            }
        }), setLaunchDetails("Carregando informações do servidor.."), refreshDistributionIndex(!0, e => {
            onDistroRefresh(e), serv = e.getServer(ConfigManager.getSelectedServer()), aEx.send({
                task: "execute",
                function: "validateEverything",
                argsArr: [ConfigManager.getSelectedServer(), DistroManager.isDevMode()]
            })
        }, e => {
            d.log("Error while fetching a fresh copy of the distribution index.", e), refreshDistributionIndex(!1, e => {
                onDistroRefresh(e), serv = e.getServer(ConfigManager.getSelectedServer()), aEx.send({
                    task: "execute",
                    function: "validateEverything",
                    argsArr: [ConfigManager.getSelectedServer(), DistroManager.isDevMode()]
                })
            }, e => {
                d.error("Unable to refresh distribution index.", e), null == DistroManager.getDistribution() ? (showLaunchFailure("Erro Fatal", "Não foi possivel carregar uma cópia do distribution index. Tente novamente. Se o erro persistir, abra um ticket em nosso Discord."), aEx.disconnect()) : (serv = data.getServer(ConfigManager.getSelectedServer()), aEx.send({
                    task: "execute",
                    function: "validateEverything",
                    argsArr: [ConfigManager.getSelectedServer(), DistroManager.isDevMode()]
                }))
            })
        })
    }
}
const news_slider = document.getElementById("news_slider"),
    nav_dots = document.getElementById("navDots");
let currentSlideIndex = 0;

function initNavDots() {
    var a = document.getElementsByClassName("slider_item");
    for (let e = 0; e <= a.length; e++) {
        var t = document.createElement("div");
        t.classList.add("navDot"), 0 == e && t.classList.add("active"), t.onclick = () => {
            currentSlideIndex = showSlide(e)
        }, t.setAttribute("index", e), nav_dots.appendChild(t)
    }
    a.length <= 1 && (nav_dots.style.display = "none")
}

function showSlide(a) {
    var t = document.getElementsByClassName("slider_item");
    if (t) {
        a >= t.length ? a = 0 : a < 0 && (a = t.length - 1);
        for (let e = 0; e < t.length; e++) {
            var n = t[e];
            e == a ? n.style.display = "flex" : n.style.display = "none"
        }
        var e = document.getElementsByClassName("navDot");
        if (e)
            for (const r of e) r.getAttribute("index") == a ? r.classList.add("active") : r.classList.remove("active");
        return a
    }
}
async function loadNewsJson() {
    try {
        var e = new Headers,
            a = (e.append("cache-control", "no-cache"), e.append("pragma", "no-cache"), {
                method: "GET",
                headers: e
            }),
            t = await (await fetch("https://launcher.pokebrasil.net/pixelmonbrasil_2.json", a)).json();
        news_slider.innerHTML = "";
        for (const n of t) {
            let e = "";
            n.link && (e = `<a class="readmore" href="${n.link}">Ver mais...</a>`), news_slider.innerHTML += `
                <div class="slider_item" style="display: none">
                    <div class="slideshowHeading">${n.title}</div>
                    <div class="slideshowContent">${n.description}</div>
                    <img class="newsImage" src="${n.imageURL||"./assets/images/render2.png"}">
                    ${e}
                </div>
            `
        }
        currentSlideIndex = showSlide(0)
    } catch (e) {
        console.log("A problem occurred trying to fetch news")
    }
}

loadNewsJson(), initNavDots(), setInterval(() => {
    currentSlideIndex = showSlide(currentSlideIndex + 1)
}, 1e4);