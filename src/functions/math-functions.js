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

    let dw = w1 - w;
    let dh = h1 - h;
    let imgW, imgH;
    if(dw < dh * k) {
        imgW = w1;
        imgH = Math.ceil(h * imgW / w);
        dw = 0;
        dh = (h1 - imgH) >> 1;            
    } else {
        imgH = h1;
        imgW = Math.ceil(w * imgH / h);
        dh = 0;
        dw = (w1 - imgW) >> 1;
    }
    return {k, imgW, imgH, w1, h1, dw, dh};
}