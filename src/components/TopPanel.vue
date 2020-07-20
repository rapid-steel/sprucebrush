<template>
    <div class="menu-tabs">
        <div class="btn" @click="$emit('new-drawing')">
            <img src="../assets/img/new-drawing.png" title="New drawing" />
        </div>
        <div class="btn" 
        :class="{active:showSizesForm}"
        @click="showSizesForm=!showSizesForm">
            <img src="../assets/img/change-sizes.png" title="Change sizes" />
            <div class="menu-form" v-show="showSizesForm">
                <div @click.stop>
                    <div>Width:</div>  
                    <input type="number" 
                    min="1" step="1" 
                    v-model="sizesModel.width" 
                    @keyup.enter="applySizes">
                </div> 
                <div @click.stop>
                    <div>Height:</div>
                    <input type="number" 
                    min="1" step="1" 
                    v-model="sizesModel.height" 
                    @keyup.enter="applySizes">
                </div>     
                <div class="footer">
                    <button class="ok-btn"
                    @click.stop="applySizes" 
                    @keyup.enter="applySizes">Ok</button>
                </div>                          
            </div>
        </div>
        <div class="btn" 
        @click="loadImage">
            <input 
            type="file" 
            ref="importImage" accept="image/*">
            <img src="../assets/img/load-image.png" title="Import image" />
        </div>    
        <div class="btn"
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
          showFiltersList: false,
          currentFilter: false,
          filters: [
              {k: "invert", label: "Invert", img: require("../assets/img/filter-invert.png")},
              {k: "grayscale", label: "Grayscale", img: require("../assets/img/filter-grayscale.png")},
              {k: "sepia", label: "Sepia", img: require("../assets/img/filter-sepia.png")},
              {k: "blur", label: "Blur",  img: require("../assets/img/filter-blur.png"), preview: true, settings: {radius: 1}, },
              {k: "bright-contr", label: "Brightness and contrast",  img: require("../assets/img/filter-bright-contr.png"), 
              preview: true, settings: {brightness: 1, contrast: 1 }},
          ],
          sizesModel: {width: 1, height: 1}
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
      this.$refs.importImage.addEventListener("change", e => {
        let file = e.target.files[0];
        if(file.type.indexOf("image") != -1) {
            this.$emit('import-image', file);
        }        
      });

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
      loadImage() {
          this.$refs.importImage.click();
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
        min-width: 200px;
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
            padding: 3px;
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

</style>
