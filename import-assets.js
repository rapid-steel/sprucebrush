const baseFolder = './src/assets/img/';
const fs = require('fs');
const path = require('path')
const allowedExts = ['.png'];



const assets = {
    textures_brush: [],
    textures_roller: [],
    patterns: []
};

Object.keys(assets).forEach(k => {
    const files = fs.readdirSync(baseFolder + k);
    if (files && files.length) {
        files
        .filter(file => allowedExts.indexOf(path.extname(file)) > -1)
        .sort((f1, f2) => f1 > f2 ? 1 : -1)
        .forEach(file => assets[k].push({
            k: path.basename(file, path.extname(file)),
            src: `../assets/img/${k}/${file}`
        }));
    }
});

fs.writeFileSync("./src/store/assets.js", `
const assets = {
    ${Object.keys(assets).map(k => {
        return `${k} : [${
            assets[k].map(img => `{
                k: "${img.k}",
                src: require("${img.src}")
            }`).join(",")
        }]`        
    }).join(",")}
};
export default assets;`);