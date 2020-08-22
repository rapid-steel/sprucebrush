const TABLE = Object.freeze([
    [-1,  0 ],  
    [ 0, -1 ],  
    [ 1,  0 ],  
    [ 0,  1 ]  
]);


function fill(coords, imageData, color, tolerance) {
    coords = coords.map(Math.round);
    let pos = [coords];
    let pos1 = [];
    const {width, height} = imageData;
    const pixels = imageData.data;
    let i0 = (coords[1] * width + coords[0]) * 4;
    const color0 = [ pixels[i0], pixels[i0+1], pixels[i0+2], pixels[i0+3]];
    const positions = new Uint8Array(width * height);
    
    let t = performance.now();
    let data1 = new ImageData( width, height );
    let pixels1 = data1.data;
    do {
        pos1 = [];
        for(let j = 0; j < pos.length; j++) {
            let x = pos[j][0];
            let y = pos[j][1];
            let p = y * width + x;
            positions[p] = 1;
            for(let i = 0; i < 4; i++) {
                pixels1[p * 4 + i] = color[i];
            }      
            for(let k = 0; k < TABLE.length; k++) {
                let x1 = x + TABLE[k][0];
                let y1 = y + TABLE[k][1];
                let ind = y1 * width + x1;
                if(ind < width * height && ind >= 0) {
                    if(positions[ind] === 0) {
                        positions[ind] = 1;
                        let ind4 = ind * 4;
                        let t = Math.abs(pixels[ind4]   - color0[0]) +
                                Math.abs(pixels[ind4+1] - color0[1]) +
                                Math.abs(pixels[ind4+2] - color0[2]) +
                                Math.abs(pixels[ind4+3] - color0[3]);
                        if(t < tolerance) {
                            pos1.push([x1, y1]);
                        } 
                    }
                }        
            }           
        }
        pos = pos1;
    }
    while(pos1.length);

    console.log(performance.now() - t)
    
    return data1;
}


export {fill}