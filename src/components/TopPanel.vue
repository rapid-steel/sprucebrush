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
    .menu-form, .menu-itemlist {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        background: $color-bg;
        border: $window-border;
        font: $font-menu;
        z-index: 1000000;
    }


}

</style>
