const logger = require('./loggerutil')('%c[DiscordWrapper]', 'color: #7289da; font-weight: bold')

const { Client } = require('discord-rpc-patch')

let client
let activity

exports.initRPC = function(playerName){
    client = new Client({ transport: 'ipc' })
    const clientId = '1023338190012153866'

    activity = {
        details: 'Jogando Pixelmon Brasil',
        state: `Treinador: ${playerName}`,
        largeImageKey: 'pkbr1',
        largeImageText: 'Pixelmon Brasil',
        smallImageKey: 'pkbr2',
        smallImageText: 'Versão 8.3.8',
        startTimestamp: new Date().getTime(),
        instance: false,
        buttons: [
            { label: 'Jogue Agora', url: 'https://github.com/xd-est19xx/Yee-Launcher-Releases/releases/latest/download/Yee.Pixelmon.Launcher.Setup.exe'},
            { label: 'Discord do servidor', url: 'https://discord.gg/pixelmonbrasil'}
        ]
    }

    client.on('ready', () => {
        logger.log('Discord RPC Conectado')
        client.setActivity(activity)
    })
    
    client.login({clientId: clientId}).catch(error => {
        if(error.message.includes('ENOENT')) {
            logger.log('Incapaz de inicializar o RPC, nenhum cliente detectado.')
        } else {
            logger.log('Incapaz de inicializar o RPC: ' + error.message, error)
        }
    })
}

exports.updateDetails = function(details){
    activity.details = details
    client.setActivity(activity)
}

exports.updateUsername = function(username) {
    activity.state = `Treinador: ${username}`
    activity.details = 'Jogando Online'
    client.setActivity(activity)
}

exports.shutdownRPC = function(){
    if(!client) return
    client.clearActivity()
    client.destroy()
    client = null
    activity = null
}