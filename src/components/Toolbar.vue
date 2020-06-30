<template>
    <div class="toolbar" 
    :id="'toolbar-' + name" :style="style"
    >
        <div class="header" ref="header">
              <span v-if="title">{{title}}</span>
        </div>
        <div class="content">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    name: String,
    title: String
  },
  computed: {
      style() {
          return {
              left: this.$store.state.userPref[this.name].x + "px",
              top:  this.$store.state.userPref[this.name].y + "px",
          }
      }
  },
  methods: {
      drag(e) {
          this.$store.commit('setPosition', {
              el: this.name,
              x: e.clientX, y: e.clientY
          });
      }
  },
  mounted() {
      let dx = 0;
      let dy = 0;
      let x = 0;
      let y = 0;
      const cb = e => {
          dx = e.screenX - x;
          dy = e.screenY - y;
          x = e.screenX;
          y = e.screenY;
          this.$store.commit('setPosition', {
              el: this.name,
              x: this.$store.state.userPref[this.name].x + dx, 
              y: this.$store.state.userPref[this.name].y + dy
          });
                    
      }
      this.$refs.header.addEventListener("mousedown", e => {
          dx = 0;
          dy = 0;
          x = e.screenX;
          y = e.screenY;
          document.addEventListener("mousemove", cb);
          document.addEventListener("mouseup", () => {
              document.removeEventListener("mousemove", cb);
          });

      });

  }
}
</script>

<style scoped lang="scss">
.toolbar {
  position: fixed;
  border: 2px solid black;
  .header {
      width: 100%;
      padding: 2.5px;    
      background: grey;
      box-sizing: border-box;
  }
  .content {
     width: 100%;
  }
}
</style>
