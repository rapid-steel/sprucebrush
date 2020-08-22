<template>
    <div class="menu-tabs">

        <div class="btn" 
            @click.stop="$emit('new-drawing')">
            <img src="../assets/img/new-drawing.png" 
                :title="$t('topPanel.newDrawing.title')" />
        </div>
        <div class="btn" 
            :class="{active: display.sizesForm}"
            @click.stop="() => setDisplay('sizesForm', !display.sizesForm)">
            <img src="../assets/img/change-sizes.png" 
                :title="$t('topPanel.sizesForm.title')" />
            <div class="menu-form" 
                v-show="display.sizesForm" 
                @click.stop>
                <div id="proportional-resize"
                   :class="{active: sizesModel.proportional}">
                    <button class="icon-btn link"                     
                    @click="()=> sizesModel.proportional = !sizesModel.proportional"/>
                </div>
                <div>
                    <div>{{$t('topPanel.sizesForm.width')}}:</div>  
                    <input type="number" 
                        min="1" step="1" 
                        v-model="sizesModel.width" 
                        @blur="() => adjustSizes('width')"
                        @keyup.enter="() => applySizes('width')">
                </div> 
                <div>
                    <div>{{$t('topPanel.sizesForm.height')}}:</div>
                    <input type="number" 
                        min="1" step="1" 
                        v-model="sizesModel.height" 
                         @blur="() => adjustSizes('height')"
                        @keyup.enter="() => applySizes('height')">
                </div> 
                <div>
                    <div>{{$t('topPanel.sizesForm.px_ratio')}}:</div>
                    <v-select 
                        v-model="sizesModel.px_ratio"
                        :options="resolutionOptions"
                        :clearable="false"
                        :searchable="false"
                     />
                </div>     
                <div>{{$t('topPanel.sizesForm.transform')}}:</div>
                <div id="resize-mode">
                    <div 
                        :class="{active: sizesModel.resizeMode == 'resize'}"
                        @click="() => sizesModel.resizeMode = 'resize'">
                        <div>
                            <img src="../assets/img/resize-mode.png" >
                        </div>
                        <div>{{$t('topPanel.sizesForm.resize')}}</div>
                    </div>
                    <div 
                        :class="{active: sizesModel.resizeMode == 'move'}"
                        @click="() => sizesModel.resizeMode = 'move'">
                        <div id="origin-mode" 
                            :class="sizesModel.originMode.split('-')">
                            <div v-for="m in originModes" 
                                :key="m"
                                :class="{active: sizesModel.originMode == m}"
                                @click="() => sizesModel.originMode = m">
                            </div>
                            <img src="../assets/img/move-mode.png" >                            
                        </div>
                        <div>{{$t('topPanel.sizesForm.move')}}</div>
                    </div>
                </div>
                <div class="footer">
                    <button class="ok-btn"
                        @click.stop="applySizes" 
                        @keyup.enter="applySizes">{{$t('common.ok')}}</button>
                </div>                          
            </div>
        </div>
        <div class="btn" 
            :class="{active: display.transformMenu}"
            @click.stop="() => setDisplay('transformMenu', !display.transformMenu)">
            <input 
            type="file" accept="image/*"
            ref="importImage" 
            @change="importImage">
            <img src="../assets/img/transform-menu.png" 
            :title="$t('topPanel.transformMenu.title')" />
            <div class="menu-itemlist" 
                v-show="display.transformMenu" 
                @click.stop>
                <div class="menu-item big"
                    v-for="action in transformations"
                    :key="action.k"
                    @click.stop="() => $emit('transform-canvas', action)">
                    <img :src="action.img">
                    <div>{{$t('topPanel.transformMenu.' + action.k)}}</div>
                </div>
            </div>
        </div>    
        <div class="btn" 
            :class="{active: display.importMenu}"
            @click.stop="() => setDisplay('importMenu', !display.importMenu)">
            <input 
            type="file" accept="image/*"
            ref="importImage" 
            @change="importImage">
            <img src="../assets/img/load-image.png" :title="$t('topPanel.importMenu.title')" />
            <div class="menu-itemlist" 
                v-show="display.importMenu" 
                @click.stop>
                <div class="menu-item big"
                    v-for="mode in importModes"
                    :key="mode.k"
                    @click.stop="() => loadImage(mode)">
                    <img :src="mode.img">
                    <div>{{$t('topPanel.importMenu.' + mode.k)}}</div>
                </div>
            </div>
        </div>    
        <div class="btn"
            :class="{active: display.filtersMenu}"
            @click.stop="() => setDisplay('filtersMenu', !display.filtersMenu)">
            <img src="../assets/img/filters.png" 
                :title="$t('topPanel.filtersMenu.title')" />
            <div class="menu-itemlist" 
                v-show="display.filtersMenu">
                <div class="menu-item" 
                    v-for="filter in filters" 
                    :key="filter.k"
                    @click="() => selectFilter(filter)">
                    <img :src="require('../assets/img/filters/filter-' + filter.k + '.png')">
                    <div>{{$t('topPanel.filtersMenu.' + filter.k + ".title")}}</div>
                </div>
            </div>
            <div class="menu-form" v-show="!!currentFilter" @click.stop>                   
                <template v-if="currentFilter.k == 'duotone'">               
                    <div>
                        <div>{{$t('topPanel.filtersMenu.duotone.colors')}}:</div> 
                        <div class="colors">
                            <div v-for="(color,i) in currentFilter.settings.colors" 
                            :key="color" class="color"
                            :class="{current: currentFilter.current == i}"
                            :style="{background: color}"
                            @click.stop="() => currentFilter.current = i"></div>
                        </div>
                    </div>
                    <color-picker 
                        v-model="currentFilter.settings.colors[currentFilter.current]"
                        @input="() => $emit('preview-filter', currentFilter)"
                        :width="180" 
                        :height="180" />                 
                </template>
                <template v-else>
                    <div v-for="el in currentFilter.form" 
                        :key="currentFilter.k + el.k">
                        <div>{{$t(`topPanel.filtersMenu.${currentFilter.k}.${el.k}`)}}:</div>  
                        <input 
                            :type="el.type" 
                            :min="el.min" 
                            :step="el.step" 
                            :max="el.max" 
                            v-model="currentFilter.settings[el.k]" 
                            @change="() => $emit('preview-filter', currentFilter)"
                            @keyup.enter="() => $emit('preview-filter', currentFilter)">
                    </div>                   
                </template>
                <div class="footer">
                    <button class="ok-btn"
                    @click.stop="applyCurrentFilter" 
                    @keyup.enter="applyCurrentFilter">Ok</button>
                    <button class="ok-btn"
                    @click.stop="cancelFilter" 
                    @keyup.enter="cancelFilter">Cancel</button>
                </div>                          
            </div>
        </div>    
         <div class="btn" 
         @click.stop="() => $emit('save-image')" 
         :title="$t('topPanel.saveImage.title')">
            <img src="../assets/img/save-image.png" />
        </div>    
    </div>


</template>

<script>
import {mapState} from "vuex";

export default {
    name: 'TopPanel',
    components: {},
    props: ["sizes"],
    data() {
        return {
            menuOpen: false,
            display: {
                sizesForm: false,
                importMenu: false,
                transformMenu: false,
                filtersMenu: false
            },
            currentFilter: false,
            importMode: "leave",
            importModes: [
                {k: "leave", img: require("../assets/img/import-leave.png")},
                {k: "resize_img", img: require("../assets/img/import-resize-img.png")},
                {k: "resize_canvas", img: require("../assets/img/import-resize-canvas.png")}
            ],
            transformations: [
                {k: "rotate90_CW", img: require("../assets/img/rotate-90-cw.png"), rotate: 90},
                {k: "rotate90_CCW", img: require("../assets/img/rotate-90-ccw.png"), rotate: -90},
                {k: "rotate180", img: require("../assets/img/rotate-180.png"), rotate: 180},
                {k: "flipX", img: require("../assets/img/flip-x.png"), flip: "x"},
                {k: "flipY", img: require("../assets/img/flip-y.png"), flip: "y"}
            ],
            filters: [{
                    k: "invert"
                },{
                    k: "grayscale"
                },{
                    k: "sepia"
                },{
                    k: "blur",  
                    preview: true, 
                    settings: {radius: 1}, 
                    form: [{
                        k: "radius", type: "number", min: 1, step: .01
                    }]
                },{
                    k: "brightness_contrast",  
                    preview: true, 
                    settings: {brightness: 1, contrast: 1 },
                    form: [{
                        k: "brightness", type: "range", min: 0, step: .01, max: 5
                    }, {
                        k: "saturate", type: "range", min: 0, step: .01, max: 5
                    }]
                },{
                    k: "hue_saturate",  
                    preview: true, 
                    settings: {hue: 0, saturation: 100, luminance: 0 },
                    form: [{
                        k: "hue", type: "range", min: -180, step: 1, max: 180
                    }, {
                        k: "saturation", type: "range", min: 0, step: 1, max: 200
                    },  {
                        k: "luminance", type: "range", min: -1, step: .01, max: 1
                    }]
                },{
                    k: "duotone",  
                    preview: true, 
                    settings: {colors: ["#006aff", "#fa00a6"] },
                    current: 0
                },{
                    k: "posterize", 
                    preview: true, 
                    settings: {levels: 4}, 
                    form: [{
                        k: "levels", type: "number", min: 2, step: 1, max: 20
                    }]
                },{
                    k: "pixelate", 
                    preview: true, 
                    settings: {size: 10}, 
                    form: [{
                        k: "size", type: "number", min: 2, step: 1, max: 180
                    }]
                }, {
                    k: "ripple",
                    preview: true,
                    settings: {scale: 10, frequency: -1},
                    form: [{
                        k: "frequency", type: "number", min: -5, step: .1, max: 0
                    }, {
                        k: "scale", type: "number", min: 1, step: 1, max: 1000
                    }]
                },{
                    k: "stereo",
                }
            ],
            sizesModel: {
                width: 1, 
                height: 1, 
                px_ratio: 1,
                originMode: "center-center", 
                resizeMode: "move",
                proportional: true
            },
            originModes: [
                'top-left',    'top-center',    'top-right', 
                'center-left', 'center-center', 'center-right', 
                'bottom-left', 'bottom-center', 'bottom-right'
            ],
            resolutionOptions: [1, 1.5, 2],
        }
    },
    watch: {
        sizes: {
            deep: true,
            handler() { 
                Object.assign(this.sizesModel, this.sizes); 
            }
        }
    },
    mounted() {
        Object.assign(this.sizesModel, this.sizes); 
    },
    methods: {
        setDisplay(k, v = false) {
            for(let el in this.display) 
                this.display[el] = k == el && v;
            this.menuOpen = v;
            if(this.menuOpen) {
                if(!this.h)
                    requestAnimationFrame(() => {
                        this.h = this.setDisplay.bind(this);
                        document.addEventListener("click", this.h);
                    });
            } else {
                document.removeEventListener("click", this.h);
                this.h = false;
            }
        },
        selectFilter(filter) {
            if(filter.preview) 
                this.currentFilter = Object.assign({}, filter);
            else this.$emit('apply-filter', filter);
        },
        applyCurrentFilter() {          
            this.$emit('apply-filter', this.currentFilter);
            this.currentFilter = false;
        },
        cancelFilter() {
            this.$emit('cancel-preview-filter');
            this.currentFilter = false;
        },
        loadImage(mode) {
            this.importMode = mode;
            this.$refs.importImage.click();
        },
        importImage(e) {
            let file = e.target.files[0];    
            if(file.type.indexOf("image") != -1) {
                this.$emit('import-image', [file, this.importMode.k]);            
            }    
        },
        clearFileInput() {
            this.$refs.importImage.value = "";
            this.$refs.importImage.type = "";
            this.$refs.importImage.type = "file";
        },
        adjustSizes(k) {
            if(this.sizesModel.proportional) {
                const k1 = {
                    width: "height",
                    height: "width"
                }[k];
                this.sizesModel[k1] = Math.round(this.sizes[k1]  / this.sizes[k] * this.sizesModel[k]);
            }
        },
        applySizes(k = false) {
            if(this.sizesModel.width && this.sizesModel.height) {
                if(k)
                    this.adjustSizes(k);
                this.$emit("change-sizes", this.sizesModel);
                this.display.sizesForm = false;
            }
            
        }
    }
}
</script>

<style scoped lang="scss">
@import "../assets/styles/colors";

.menu-tabs { 
    display: flex; 
    justify-content: flex-start;
    width: 100%;    
    position: relative;
    z-index: $z-index_menu;
    
    .btn {
        flex: 1 0 $btn-top-size;
        height: $btn-top-size;
        max-width: $btn-top-size;
        margin: 0 10px;
        
        img {
            width: 100%;
            height: 100%;
        }
        position: relative;
        
        &.active {
            &::after {
                position: absolute;
                content: "";
                display: block;
                top: 100%;
                right: 0;
                left: 0;
                border-top: 4px $color-accent solid;
            }
        }
    }
    .menu-form {
        padding: 15px;
        min-width: 240px;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        & > div {
            flex: 1 0 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            &.cpw_container {
                flex: 5 0 180px;
                margin-top: 25px!important;
            }
        }
        .footer {
            justify-content: center;
        }
        input {
            border: $input-border;
            border-radius: 0;
            width: 60px;
            padding: 5px;
            font: $font-input;
        }

        .colors {
            flex: 2 1 100px;
            justify-content: center;
            .color {
                width: 35px;
                height: 35px;
                border: 1px solid black;         
                &:not(:last-child) { margin-right: 35px; } 
                &.current {
                    outline: 2px $color-selected solid;
                }        
            }

        }


    }
    .menu-itemlist {
        font: $font-menu;
        .menu-item {
            display: flex;            
            justify-content: stretch;
            align-items: center;
            padding: 3px;
            &:hover {
                background-color: $color-accent3;
                //color: $color-bg;
                font-weight: bold;
            }
            & > div {
                white-space: nowrap;
                padding: 5px 1px;
                flex: 1 1 100%;
            }
            img {
                width: 32px;
                height: 32px;
                margin-right: 3px;
            }
            &.big {
                padding: 5px;
                img {
                    width: 64px;
                    height: 64px;
                    margin-right: 5px;
                }
            }

        
        }
    }
    .menu-form {
        font: $font-menu-form;
    }
    .menu-form, .menu-itemlist {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        background: $color-bg;        
        border: $window-border;
        z-index: $z-index_menu;
        .v-select {
            min-width: 65px;
        }
    }

}

#proportional-resize {
    position: absolute;
    height: 40px;
    width: 30px;
    left: 150px;
    top: 30px;
    button {
        opacity: .5;
        position: absolute;
        top: 50%;
        left: 0;
        transform: translate(-50%,-50%);
        background-color: white;
    }
    border: 3px dashed transparent;
    border-right: none;
    &.active {
        border-color: $color-accent;
        button {
            opacity: 1;
            border: 2px solid black;
        }
    }
}

#resize-mode {
    display: flex;
    justify-content: space-around;
    font: $font-menu;
    & > div {
        flex: 1 1 100px;
        margin: 7px;
        height: 90px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-content: stretch;
        & > :first-child {
            flex: 3.5 1 70px;         
            outline: 1px dashed rgba(0,0,0,.25);   
            position: relative; 
            & > img {
                width: 100px;
                height: 70px;
            }
        }
        
        & > :last-child {
            flex: 1 0 20px;
        }
        #origin-mode {
            opacity: .3;
            pointer-events: none;
            display: flex;
            flex-wrap: wrap;
            justify-content: stretch;
            align-items: stretch;
            position: relative;
            img {
                position: absolute;
                width: 66%;
                height: 66%;
                pointer-events: none;
                z-index: -1;
                top: 16.5%;
                left: 16.5%;
            }
            &.top {
                img { top: 0; }
            }
            &.bottom {
                img { top: 33%; }
            }
            &.left {
                img { left: 0; }
            }
            &.right {
                img { left: 33%; }
            }

            & > div {
                flex: 1 0 33%;
                height: 33%;
                max-width: 33%;
                outline: 1px dashed rgba(0,0,0,.25);
            }
        }
        &.active {
            outline: 2px solid black;
            #origin-mode {
                pointer-events: all;
                opacity: 1;                
            }
        }
    }
}

</style>
