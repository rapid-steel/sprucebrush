
export function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
export function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  
export function toHex(str) {      
      if(str.indexOf("#") == 0) return str;
      if(str.indexOf("rgb") == 0) 
          return rgbToHex(...( str.replace(")", "").split("(")[1].split(",")).map(s => +s));
 }


export function validateRgb(str) {
    let vals = str.replace(")", "").split("(")[1].split(",").map(s => +s);  
    return vals[0] <= 255 && vals[1] <= 255 && vals[2] <= 255 && (vals.length == 3 || vals[3] <= 1);
}


export function getRgba(color) {
    if(color.indexOf("rgb") == 0) {
        let vals = color.replace(")", "").split("(")[1].split(",").map(s => +s);
        if(vals.length == 3) vals.push(255);
        else vals[3] = 255 * vals[3];
        return vals;
    } 
    if(color.indexOf("#") == 0) {
        color = color.slice(1);
        let vals = [];
        while(color.length) {
            vals.push(parseInt(color.slice(0,2), 16));
            color = color.slice(2);
        }
        if(vals.length == 3) vals.push(255);
        return vals;
    }
}

export function getGlColor(color) {
    if(color.indexOf("rgb") == 0) {
        return color.replace(")", "")
        .split("(")[1]
        .split(",").map(s => (+s) / 255).slice(0, 3);
    } 
    if(color.indexOf("#") == 0) {
        color = color.slice(1);
        let vals = [];
        for(let i = 0; i < 6; i += 2) {
            vals.push(parseInt(color.slice(i,i + 2), 16) / 255);
        }
        return vals;
    }
}

const patternHex = /(#)?[0-9a-f]{6}/ig;
const patternRgb = /rgb(\s+)?\((\s+)?[0-9]{1,3}(\s+)?,(\s+)?[0-9]{1,3}(\s+)?,(\s+)?[0-9]{1,3}(\s+)?\)/ig;
const patternRgba = /rgba(\s+)?\((\s+)?[0-9]{1,3}(\s+)?,(\s+)?[0-9]{1,3}(\s+)?,(\s+)?[0-9]{1,3}(\s+)?,(\s+)?[\.0-9]+(\s+)?\)/ig;

export function extractColorsFromText(text) {
    let colors = [];
    let colorsHex = text.match(patternHex).map(c => c[0] != "#" ? "#" + c : c);
    if(colorsHex) colors = colors.concat(colorsHex.map(c => c.toLowerCase()));
    let colorsRgb = text.match(patternRgb);
    if(colorsRgb) colors = colors.concat(colorsRgb.filter(validateRgb).map(toHex));
    let colorsRgba = text.match(patternRgba);
    if(colorsRgba) colors = colors.concat(colorsRgba.filter(validateRgb).map(toHex));

    let codes = {};
    let colors_uniq = [];
    for(let i = 0; i < colors.length; i++) {
        if(!codes[colors[i]]) {
            codes[colors[i]] = 1;
            colors_uniq.push(colors[i]);
        }
    }
    return colors_uniq;
}