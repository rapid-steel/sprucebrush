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
            
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0,0,this.sizes.width, this.sizes.height);

            this.currentLayer.ctx.clearRect(0,0,this.sizes.width, this.sizes.height);
            filterFunctions[filter.k](this.currentLayer.ctx, filter.settings);
            this.currentLayer.ctx.drawImage(this.tempCtx.canvas, 0,0,this.sizes.width, this.sizes.height);
            this.currentLayer.ctx.filter = "none";     
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
                   

        },
        previewFilter(filter) {    
            this.currentLayer.ctx.canvas.style.opacity = 0;        
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
            filterFunctions[filter.k](this.tempCtx, filter.settings);
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0,0,this.sizes.width, this.sizes.height);
            this.tempCtx.filter = "none";

        },
        cancelPreviewFilter() {
            this.currentLayer.ctx.canvas.style.opacity = this.currentLayer.opacity;   
            this.tempCtx.filter = "none";
            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
        }
    }
}
</script>