<template>
    <div class="menu-tabs">
        <div class="btn" @click="$emit('new-drawing')">
            <img src="../assets/img/new-drawing.png" title="New drawing" />
        </div>
        <div class="btn" 
        :class="{active:showSizesForm}"
        @click="showSizesForm=!showSizesForm">
            <img src="../assets/img/change-sizes.png" title="Change sizes" />
            <div class="menu-form" v-show="showSizesForm" @click.stop>
                <div>
                    <div>Width:</div>  
                    <input type="number" 
                    min="1" step="1" 
                    v-model="sizesModel.width" 
                    @keyup.enter="applySizes">
                </div> 
                <div>
                    <div>Height:</div>
                    <input type="number" 
                    min="1" step="1" 
                    v-model="sizesModel.height" 
                    @keyup.enter="applySizes">
                </div>     
                <div>Transform existing content:</div>
                <div id="resize-mode">
                    <div 
                        :class="{active: sizesModel.resizeMode == 'resize'}"
                        @click="() => sizesModel.resizeMode = 'resize'">
                        <div><img src="../assets/img/resize-mode.png" ></div>
                        <div>Resize</div>
                    </div>
                    <div 
                        :class="{active: sizesModel.resizeMode == 'move'}"
                        @click="() => sizesModel.resizeMode = 'move'">
                        <div id="origin-mode" :class="sizesModel.originMode.split('-')">
                            <div v-for="m in originModes" 
                                :key="m"
                                :class="{active: sizesModel.originMode == m}"
                                @click="() => sizesModel.originMode = m">
                            </div>
                            <img src="../assets/img/move-mode.png" >                            
                        </div>
                        <div>Move</div>
                    </div>
                </div>
                <div class="footer">
                    <button class="ok-btn"
                    @click.stop="applySizes" 
                    @keyup.enter="applySizes">Ok</button>
                </div>                          
            </div>
        </div>
        <div class="btn" 
        :class="{active:showImportMenu}"
        @click="() => showImportMenu = !showImportMenu">
            <input 
            type="file" @change="importImage"
            ref="importImage" accept="image/*">
            <img src="../assets/img/load-image.png" title="Import image" />
            <div class="menu-itemlist" v-show="showImportMenu" @click.stop>
                <div class="menu-item big"
                    v-for="mode in importModes"
                    :key="mode.k"
                    @click.stop="() => loadImage(mode)"
                >
                    <img :src="mode.img">
                    <div>{{mode.label}}</div>
                </div>

            </div>
        </div>    
        <div class="btn"
        :class="{active:showFiltersList}"
        @click="() => showFiltersList = !showFiltersList">
            <img src="../assets/img/filters.png" title="Image filters" />
            <div class="menu-itemlist" v-show="showFiltersList">
                <div class="menu-item" 
                v-for="filter in filters" 
                :key="filter.k"
                @click="() => selectFilter(filter)">
                    <img :src="filter.img">
                    <div>{{filter.label}}</div>
                </div>
            </div>
            <div class="menu-form" v-show="!!currentFilter">
                <template v-if="currentFilter.k == 'blur'">
                    <div>
                        <div>Radius:</div>  
                        <input type="number" 
                        min="1" step=".1" 
                        v-model="currentFilter.settings.radius" 
                        @change="() => $emit('preview-filter', currentFilter)"
                        @keyup.enter="() => $emit('preview-filter', currentFilter)">
                    </div>
                </template>
                <template v-if="currentFilter.k == 'bright-contr'">
                    <div>
                        <div>Brightness:</div>  
                        <input type="range" 
                        min="0" step=".1" max="5" 
                        v-model="currentFilter.settings.brightness" 
                        @change="() => $emit('preview-filter', currentFilter)"
                        @keyup.enter="() => $emit('preview-filter', currentFilter)">
                    </div>
                    <div>
                        <div>Contrast:</div>  
                        <input type="range" 
                        min="0" step=".1" max="5" 
                        v-model="currentFilter.settings.contrast" 
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
         @click="() => $emit('save-image')" 
         title="Save as image">
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
          showSizesForm: false,
          showImportMenu: false,
          showFiltersList: false,
          currentFilter: false,
          importMode: "leave",
          importModes: [
              {k: "leave", img: require("../assets/img/import-leave.png"), label: "Keep sizes, place to center"},
              {k: "resize-img", img: require("../assets/img/import-resize-img.png"), label: "Adjust image size to canvas"},
              {k: "resize-canvas", img: require("../assets/img/import-resize-canvas.png"), label: "Adjust canvas size to image"}

          ],
          filters: [
              {k: "invert", label: "Invert", img: require("../assets/img/filter-invert.png")},
              {k: "grayscale", label: "Grayscale", img: require("../assets/img/filter-grayscale.png")},
              {k: "sepia", label: "Sepia", img: require("../assets/img/filter-sepia.png")},
              {k: "blur", label: "Blur",  img: require("../assets/img/filter-blur.png"), preview: true, settings: {radius: 1}, },
              {k: "bright-contr", label: "Brightness and contrast",  img: require("../assets/img/filter-bright-contr.png"), 
              preview: true, settings: {brightness: 1, contrast: 1 }},
          ],
          sizesModel: {width: 1, height: 1, originMode: "center-center", resizeMode: "move"},
          originModes: [
              'top-left', 'top-center', 'top-right', 
              'center-left', 'center-center', 'center-right', 
              'bottom-left', 'bottom-center', 'bottom-right'
            ]
      }
  },
  watch: {
      sizes() { 
          Object.assign(this.sizesModel, this.sizes); 
      }
  },
  computed: {
  },
  mounted() {
      Object.assign(this.sizesModel, this.sizes); 
  },
  methods: {
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
      applySizes() {
          if(this.sizesModel.width && this.sizesModel.height) {
            this.$emit("change-sizes", this.sizesModel);
            this.showSizesForm = false;
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
        z-index: 1000000;
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
