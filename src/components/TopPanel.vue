<template>
    <div class="menu-tabs">
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
  data() {
      return {
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
      }
  }
}
</script>

<style scoped lang="scss">
.menu-tabs { 
    display: flex; 
    justify-content: flex-start;
    width: 100%;    
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
}

</style>
