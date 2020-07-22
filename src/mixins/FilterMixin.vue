<template>
    <div></div>
</template>

<script>

const filterFunctions = {
    invert: ctx => {
        ctx.filter = "invert(1)";
    },
    grayscale: ctx => {
        ctx.filter = "grayscale(100%)";        
    },
    sepia: ctx => {
        ctx.filter = "sepia(100%)";    
    },
    blur: (ctx, settings) => {
        ctx.filter = `blur(${settings.radius}px)`;
        console.log(ctx.filter, settings)
    },
    'bright-contr': (ctx, settings) => {
        ctx.filter = `brightness(${settings.brightness})contrast(${settings.contrast})`
    },
    posterize: (ctx, settings) => {
        let levels = [];
        for(let i = 0; i < settings.levels; i++) {
            levels.push(i / (settings.levels - 1));
        }
        levels = levels.join(" ");
        document.getElementById("posterize")
        .querySelectorAll("feComponentTransfer > *")
        .forEach(f => {
            f.setAttribute("tableValues", levels);
        })
        ctx.filter = `url(#posterize)`;
    },
    pixelate: (ctx, settings) => {
        const filter = document.getElementById("pixelate");
        filter.querySelector("feFlood").setAttribute("x", settings.size / 2 - 2);
        filter.querySelector("feFlood").setAttribute("y", settings.size / 2 - 2);
        filter.querySelector("feComposite").setAttribute("width", settings.size);
        filter.querySelector("feComposite").setAttribute("height", settings.size);
        filter.querySelector("feMorphology").setAttribute("radius", settings.size / 2);
        ctx.filter = `url(#pixelate)`;
    }

};

export default {
    methods: {
        applyFilter(filter) {
            this.cancelPreviewFilter();
            this.history.append({
              instrument: "filter",
              layer: this.currentLayer,
              state:  this.currentLayer.ctx.getImageData(0, 0, this.sizes.width, this.sizes.height)
            });
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
            filterFunctions[filter.k](this.tempCtx, filter.settings);
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0,0,this.sizes.width, this.sizes.height);

            this.currentLayer.ctx.clearRect(0,0,this.sizes.width, this.sizes.height);
            
            this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0,0,this.sizes.width, this.sizes.height);
            this.currentLayer.ctx.filter = "none";     
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
            this.render();
        },
        previewFilter(filter) {      
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
            filterFunctions[filter.k](this.tempCtx, filter.settings);
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0,0,this.sizes.width, this.sizes.height);
            this.tempCtx.filter = "none";

            this.render(true);       

        },
        cancelPreviewFilter() {
            this.tempCtx.filter = "none";
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
        }
    }
}
</script>