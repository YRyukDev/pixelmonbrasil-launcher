const loginOfflineUsername=document.getElementById("loginOfflineUsername"),loginOfflineButton=document.getElementById("loginOfflineConfirm"),loginOfflineNameError=document.getElementById("loginOfflineNameError"),loginOfflineCancelContainer=document.getElementById("loginOfflineCancelContainer"),loginOfflineCancelButton=document.getElementById("loginOfflineCancelButton"),loggerOffline=LoggerUtil1("%c[LoginOffline]","color: #000668; font-weight: bold");function toggleCancelButton(e){e?$(loginOfflineCancelContainer).show():$(loginOfflineCancelContainer).hide()}function loginOfflineDisabled(e){loginOfflineButton.disabled!==e&&(loginOfflineButton.disabled=e)}function validateUsername(e){e?validUsername.test(e)&&3<=e.length&&e.length<=16?(loginOfflineNameError.style.opacity=0,loginOfflineDisabled(!1)):(showError(loginOfflineNameError,Lang.queryJS("login.error.invalidValue")),loginOfflineDisabled(!0)):(showError(loginOfflineNameError,Lang.queryJS("login.error.requiredValue")),loginOfflineDisabled(!0))}loginOfflineCancelButton.onclick=e=>{switchView(getCurrentView(),loginViewOnCancel,500,500,()=>{loginOfflineUsername.value="",toggleCancelButton(!1)})},loginOfflineUsername.addEventListener("focusout",e=>{validateUsername(e.target.value),shakeError(loginOfflineNameError)}),loginOfflineUsername.addEventListener("input",e=>{validateUsername(e.target.value)}),loginOfflineButton.addEventListener("click",async e=>{var n=await AuthManager.addAccount(loginOfflineUsername.value);updateSelectedAccount(n),setTimeout(()=>{switchView(VIEWS.loginOffline,VIEWS.landing,500,500,()=>{prepareSettings(),loginOfflineDisabled(!(loginOfflineUsername.value="")),loginViewOnSuccess=VIEWS.landing,loginCancelEnabled(!1),loginViewCancelHandler=null,$(".circle-loader").toggleClass("load-complete"),$(".checkmark").toggle(),loginLoading(!1),loginButton.innerHTML=loginButton.innerHTML.replace(Lang.queryJS("login.success"),Lang.queryJS("login.login")),formDisabled(!1)})},0)});