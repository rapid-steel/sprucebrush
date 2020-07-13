<template>
    <div class="menu-tabs">
        <div class="btn" @click="$emit('new-drawing')">
            <img src="../assets/img/new-drawing.png" title="New drawing" />
        </div>
        <div class="btn" @click="showSizesForm=true">
            <img src="../assets/img/change-sizes.png" title="Change sizes" />
            <div class="menu-form" v-show="showSizesForm">
                <div>Width:  <input type="number" min="1" step="1" v-model="sizesModel.width" @keyup.enter="applySizes"></div> 
                <div>Height: <input type="number" min="1" step="1" v-model="sizesModel.height" @keyup.enter="applySizes"></div>     
                <div><button @click.stop="applySizes" @keyup.enter="applySizes" class="ok-btn">Ok</button></div>                          
            </div>
        </div>
        <div class="btn" @click="loadImage">
            <input type="file" ref="importImage" accept="image/*">
            <img src="../assets/img/load-image.png" title="Import image" />
        </div>    
         <div class="btn" @click="() => $emit('save-image')" title="Save as image">
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
          sizesModel: {width: 0, height: 0}
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
          this.$emit("change-sizes", this.sizesModel);
          this.showSizesForm = false;
      }
  }
}
</script>

<style scoped lang="scss">
.menu-tabs { 
    display: flex; 
    justify-content: flex-start;
    width: 100%;    
    position: relative;
    input[type=file] {
        width: 0;
        visibility: hidden;
    }
    .btn {
        flex: 1 0 50px;
        height: 50px;
        max-width: 50px;
        
        img {
            width: 100%;
            height: 100%;
        }
        
        &.selected {
            filter: invert(1);
        }
    }
    .menu-form, .menu-itemlist {
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
    }

}

</style>
