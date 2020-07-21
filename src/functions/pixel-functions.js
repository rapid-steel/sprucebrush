export function fill(pos, positions, pixels, color, color0, width, height, tolerance, pixels1) {
    let pos1 = [];
    pixels1 = pixels1 || new ImageData( width, height ).data;
    
    pos.forEach(([x,y]) => {
      let p = y * width + x
      positions[p] = 1;
      for(let i = 0; i < 4; i++) {
        pixels1[p * 4 + i] = color[i] 
      }
      
      [
        [x - 1, y],  [x - 1, y-1],
        [x, y -1],  [x - 1, y+1],
        [x + 1, y],  [x + 1, y-1],
        [x, y + 1],  [x + 1, y - 1],
      ].forEach(([x1, y1]) => {
        let ind = y1 * width + x1
        if(ind < width * height && ind >= 0) {
          if(positions[ind] == 0) {
            positions[ind] = 1;
            let t = 0;
            for(let i = 0; i < 4; i++) {
              t += Math.abs(
                pixels[ind * 4 + i] - color0[i]
              )
            }
            if(t < tolerance) {
              pos1.push([x1, y1]);
            }
          }
        }
      })                 
    })
    if(pos1.length) {
        pixels1 = fill(pos1, positions, pixels, color, color0, width, height, tolerance, pixels1)
        
      }
  
    return pixels1;
  
  }