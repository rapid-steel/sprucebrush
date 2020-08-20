export function round2n(w, h) {
    let w1 = 1, h1 = 1, k = 0;
    let n = w << 1; // eslint-disable-next-line
    while(n >>>= 1) {
        w1 <<= 1;
        k++;
    }
    n = h << 1; // eslint-disable-next-line
    while(n >>>= 1) { 
        h1 <<= 1;
        k--;
    }

    k = k >= 0 ? 1 << k : 1 / (1 << -k) 

    let offsetX = w1 - w;
    let offsetY = h1 - h;
    let imgWidth, imgHeight;
    if(offsetX < offsetY * k) {
        imgWidth = w1;
        imgHeight = Math.ceil(h * imgWidth / w);
        offsetX = 0;
        offsetY = (h1 - imgHeight) >> 1;            
    } else {
        imgHeight = h1;
        imgWidth = Math.ceil(w * imgHeight / h);
        offsetY = 0;
        offsetX = (w1 - imgWidth) >> 1;
    }
    return {
        k, imgWidth, imgHeight, offsetX, offsetY,
        width: w1, height: h1
    };
}
