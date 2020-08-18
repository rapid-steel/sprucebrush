
import {getRgba} from "../functions/color-functions";

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
    },
    brightness_contrast: (ctx, settings) => {
        ctx.filter = `brightness(${settings.brightness})contrast(${settings.contrast})`;
    },
    hue_saturate: (ctx, settings) => {
        const l = settings.luminance;
        const values = [
            1, 0, 0, 0, l,
            0, 1, 0, 0, l,
            0, 0, 1, 0, l,
            0, 0, 0, 1, 0,
        ];
        document.getElementById("lum-matrix")
        .setAttribute("values",values.join(" "));
        ctx.filter = `hue-rotate(${settings.hue}deg)saturate(${settings.saturation}%)url(#luminance)`;
    },
    duotone: (ctx, settings) => {
        const rgba = settings.colors.map(getRgba);
        const filter = document.getElementById("duotone");
        filter.querySelector("feFuncR").setAttribute("tableValues", rgba.map(c => c[0] / 255).join(" "));
        filter.querySelector("feFuncG").setAttribute("tableValues", rgba.map(c => c[1] / 255).join(" "));
        filter.querySelector("feFuncB").setAttribute("tableValues", rgba.map(c => c[2] / 255).join(" "));
        ctx.filter = "url(#duotone)";
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
    },
    ripple: (ctx, settings) => {
        const filter = document.getElementById("ripple");
        filter.querySelector("feTurbulence").setAttribute("baseFrequency", Math.pow(10, settings.frequency));
        filter.querySelector("feDisplacementMap").setAttribute("scale", settings.scale);
        ctx.filter = `url(#ripple)`;
    },
    stereo: (ctx, settings) => {
        ctx.filter = `url(#stereo)`;
    }

};

export default {
    methods: {
        applyFilter(filter) {
            this.writeHistory();

            this.tempCtx.clearRect(0,0,this.sizes.width, this.sizes.height);
            filterFunctions[filter.k](this.tempCtx, filter.settings);
            this.tempCtx.drawImage(this.currentLayer.ctx.canvas, 0,0,this.sizes.width, this.sizes.height);
            this.tempCtx.filter = "none";

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
            this.render();
        }
    }
};