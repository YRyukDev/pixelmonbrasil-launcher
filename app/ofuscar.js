const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const dir = 'pxbrlauncher\app\ofuscar.js';
fs.readdirSync(dir).forEach(file => {
    if (path.extname(file) === '.js') {
        const filePath = path.join(dir, file);
        const originalCode = fs.readFileSync(filePath, 'utf-8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(originalCode, {
            // Configurações de ofuscação (ajuste conforme necessário)
        }).getObfuscatedCode();
        fs.writeFileSync(filePath, obfuscatedCode);
        console.log(`Arquivo ofuscado: ${file}`);
    }
});
