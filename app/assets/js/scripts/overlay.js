function isOverlayVisible(){return document.getElementById("main").hasAttribute("overlay")}let overlayHandlerContent;function overlayKeyHandler(e){"Enter"!==e.key&&"Escape"!==e.key||document.getElementById(overlayHandlerContent).getElementsByClassName("overlayKeybindEnter")[0].click()}function overlayKeyDismissableHandler(e){"Enter"===e.key?document.getElementById(overlayHandlerContent).getElementsByClassName("overlayKeybindEnter")[0].click():"Escape"===e.key&&document.getElementById(overlayHandlerContent).getElementsByClassName("overlayKeybindEsc")[0].click()}function bindOverlayKeys(e,t,n){overlayHandlerContent=t,document.removeEventListener("keydown",overlayKeyHandler),document.removeEventListener("keydown",overlayKeyDismissableHandler),e&&(n?document.addEventListener("keydown",overlayKeyDismissableHandler):document.addEventListener("keydown",overlayKeyHandler))}function toggleOverlay(e,t=!1,n="overlayContent"){null==e&&(e=!document.getElementById("main").hasAttribute("overlay")),"string"==typeof t&&(n=t,t=!1),bindOverlayKeys(e,n,t),e?(document.getElementById("main").setAttribute("overlay",!0),$("#main *").attr("tabindex","-1"),$("#"+n).parent().children().hide(),$("#"+n).show(),t?$("#overlayDismiss").show():$("#overlayDismiss").hide(),$("#overlayContainer").fadeIn({duration:250,start:()=>{getCurrentView()===VIEWS.settings&&(document.getElementById("settingsContainer").style.backgroundColor="transparent")}})):(document.getElementById("main").removeAttribute("overlay"),$("#main *").removeAttr("tabindex"),$("#overlayContainer").fadeOut({duration:250,start:()=>{getCurrentView()===VIEWS.settings&&(document.getElementById("settingsContainer").style.backgroundColor="rgba(0, 0, 0, 0.50)")},complete:()=>{$("#"+n).parent().children().hide(),$("#"+n).show(),t?$("#overlayDismiss").show():$("#overlayDismiss").hide()}}))}function toggleServerSelection(e){prepareServerSelectionList(),toggleOverlay(e,!0,"serverSelectContent")}function setOverlayContent(e,t,n,r="Dismiss"){document.getElementById("overlayTitle").innerHTML=e,document.getElementById("overlayDesc").innerHTML=t,document.getElementById("overlayAcknowledge").innerHTML=n,document.getElementById("overlayDismiss").innerHTML=r}function setOverlayHandler(e){document.getElementById("overlayAcknowledge").onclick=null==e?()=>{toggleOverlay(!1)}:e}function setDismissHandler(e){document.getElementById("overlayDismiss").onclick=null==e?()=>{toggleOverlay(!1)}:e}function setServerListingHandlers(){Array.from(document.getElementsByClassName("serverListing")).map(n=>{n.onclick=e=>{if(!n.hasAttribute("selected")){var t=document.getElementsByClassName("serverListing");for(let e=0;e<t.length;e++)t[e].hasAttribute("selected")&&t[e].removeAttribute("selected");n.setAttribute("selected",""),document.activeElement.blur()}}})}function setAccountListingHandlers(){Array.from(document.getElementsByClassName("accountListing")).map(n=>{n.onclick=e=>{if(!n.hasAttribute("selected")){var t=document.getElementsByClassName("accountListing");for(let e=0;e<t.length;e++)t[e].hasAttribute("selected")&&t[e].removeAttribute("selected");n.setAttribute("selected",""),document.activeElement.blur()}}})}function populateServerListings(){var e=DistroManager.getDistribution(),t=ConfigManager.getSelectedServer();let n="";for(const r of e.getServers())n+=`<button class="serverListing" servid="${r.getID()}" ${r.getID()===t?"selected":""}>
            <img class="serverListingImg" src="${r.getIcon()}"/>
            <div class="serverListingDetails">
                <span class="serverListingName">${r.getName()}</span>
                <span class="serverListingDescription">${r.getDescription()}</span>
                <div class="serverListingInfo">
                    <div class="serverListingVersion">${r.getMinecraftVersion()}</div>
                    <div class="serverListingRevision">${r.getVersion()}</div>
                    ${r.isMainServer()?`<div class="serverListingStarWrapper">
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
        </button>`;document.getElementById("serverSelectListScrollable").innerHTML=n}function populateAccountListings(){const t=ConfigManager.getAuthAccounts();var n=Array.from(Object.keys(t),e=>t[e]);let r="";for(let e=0;e<n.length;e++)r+=`<button class="accountListing" uuid="${n[e].uuid}" ${0===e?"selected":""}>
            <img src="https://mc-heads.net/head/${n[e].uuid}/40">
            <div class="accountListingName">${n[e].displayName}</div>
        </button>`;document.getElementById("accountSelectListScrollable").innerHTML=r}function prepareServerSelectionList(){populateServerListings(),setServerListingHandlers()}function prepareAccountSelectionList(){populateAccountListings(),setAccountListingHandlers()}document.getElementById("serverSelectConfirm").addEventListener("click",()=>{var t,e,n=document.getElementsByClassName("serverListing");for(let e=0;e<n.length;e++)if(n[e].hasAttribute("selected"))return t=DistroManager.getDistribution().getServer(n[e].getAttribute("servid")),updateSelectedServer(t),refreshServerStatus(!0),void toggleOverlay(!1);0<n.length&&(e=DistroManager.getDistribution().getServer(n[i].getAttribute("servid")),updateSelectedServer(e),toggleOverlay(!1))}),document.getElementById("accountSelectConfirm").addEventListener("click",()=>{var t,e,n=document.getElementsByClassName("accountListing");for(let e=0;e<n.length;e++)if(n[e].hasAttribute("selected"))return t=ConfigManager.setSelectedAccount(n[e].getAttribute("uuid")),ConfigManager.save(),updateSelectedAccount(t),getCurrentView()===VIEWS.settings&&prepareSettings(),toggleOverlay(!1),void validateSelectedAccount();0<n.length&&(e=ConfigManager.setSelectedAccount(n[0].getAttribute("uuid")),ConfigManager.save(),updateSelectedAccount(e),getCurrentView()===VIEWS.settings&&prepareSettings(),toggleOverlay(!1),validateSelectedAccount())}),document.getElementById("serverSelectCancel").addEventListener("click",()=>{toggleOverlay(!1)}),document.getElementById("accountSelectCancel").addEventListener("click",()=>{$("#accountSelectContent").fadeOut(250,()=>{$("#overlayContent").fadeIn(250)})});