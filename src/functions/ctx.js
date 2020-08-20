// just in case if i'll move to offscreen canvas or so,
// isolating creating of contexts
// and also some common operations to not copypaste them everywhere


function create(w, h, context) {
    let ctx = document.createElement("canvas").getContext(context);
    resize(ctx, w, h);
    if(context == "2d") {
        disableSmoothing(ctx);
    }
    return ctx;
}
function resize(ctx, w, h) {
    w = w < 1 ? 1 : w;
    h = h < 1 ? 1 : h;
    ctx.canvas.width = w;    
    ctx.canvas.height = h;
    ctx.canvas.style.width = w + "px";
    ctx.canvas.style.height = h + "px";
}

function disableSmoothing(ctx) {
    ctx.imageSmoothingEnabled = false;
    //ctx.translate(0.5, 0.5);
    ctx.save();      
}

function loadImg(src, getSizes = (width, height) => ({})) {
    const img = new Image();
    return new Promise((resolve) => {
        img.onload = () => {
            const sizes = Object.assign({
                offsetX: 0,
                offsetY: 0,
                imgWidth: img.width,
                imgHeight: img.height,
                width: img.width,
                height: img.height,
            }, getSizes(img.width, img.height));
            const ctx = create(sizes.width, sizes.height, "2d");
            console.log(sizes, img.width, img.height)
            ctx.drawImage(img, 
                sizes.offsetX, sizes.offsetY,  
                sizes.imgWidth, sizes.imgHeight
            );
            resolve(ctx);   
        };
        img.src = src;
    });
}

export default { create, resize, loadImg, disableSmoothing };