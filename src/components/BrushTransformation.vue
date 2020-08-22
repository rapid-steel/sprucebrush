<template>
<div class="brush-transformation">
    <div class="world-axes">
        <div class="width" ref="width"></div>
        <div class="x-axis"></div>
        <div class="y-axis"></div>
        <div class="shape-axes"
            :class="currentSettings.texture ? 'texture' : currentSettings.values.shape " 
            :style="angleStretchStyles"
            @mousedown.stop="startRotate">
            <div class="center" ref="center" ></div>
            <div class="x-axis" @mousedown.stop="startResizeX"></div>
            <div class="y-axis" @mousedown.stop="startResizeY"></div>
        </div>
    </div>
</div>
</template>

<script>
import {mapState, mapGetters} from "vuex";
export default {
    computed: {
        ...mapState(['currentTool', 'settings']),
        ...mapGetters(['currentSettings']),
        steps() {
            return {
                angle: this.settings.values.angle.step,
                stretch: this.settings.values.stretch.step
            };
        },
         angleStretchStyles() {
            if(this.currentSettings.webglTool !== 'brush') return {};
            const {angle, stretch} = this.currentSettings.values;
            const width = 100 * Math.min(1, stretch)  + "%";
            const height = 100 / Math.max(1, stretch) + "%";
            return {
                width,
                height,
                minWidth: width,   // ты мне это тут не это давай
                minHeight: height,
                maxWidth: width,
                maxHeight: height,
                transform: `translate(-50%,-50%)rotate(${angle}deg)`,
                backgroundImage: this.currentSettings.texture ? 
                    `url(${this.currentSettings.texture.src})` 
                    : 'none'
            };
        }
    },
    methods: {
        fireHandler(handler) {
            let stop = () => {
                document.removeEventListener("mousemove", handler);
                document.removeEventListener("mouseup", stop);
            };
            document.addEventListener("mousemove", handler);
            document.addEventListener("mouseup", stop);
        },
        startResizeX(e) {
            let {left, top} = this.$refs.center.getBoundingClientRect();
            let {width} = this.$refs.width.getBoundingClientRect();
            this.fireHandler(e => {
                let [x, y] = [event.clientX - left, event.clientY - top];
                let len = Math.sqrt(x*x + y*y);
                if(len > 0) {
                    let k = Math.round(
                        Math.min(1, len / width) / this.steps.stretch
                    ) * this.steps.stretch;
                    this.$store.commit("changeSettings", {
                        tool: this.currentTool,
                        updates: {
                            values: { stretch: k }
                        }
                    });
                }               
            });          
        },
        startResizeY(e) {
            let {left, top} = this.$refs.center.getBoundingClientRect();
            let {width} = this.$refs.width.getBoundingClientRect();
            this.fireHandler(e => {
                let [x, y] = [event.clientX - left, event.clientY - top];
                let len = Math.sqrt(x*x + y*y);
                if(len > 0) {
                    let k = Math.round(
                        Math.max(1, 1 / (len / width)) / this.steps.stretch
                    ) * this.steps.stretch;
                    this.$store.commit("changeSettings", {
                        tool: this.currentTool,
                        updates: {
                            values: { stretch: k }
                        }
                    });
                }               
            });          

        },
        getAngle(x, y) {
            let angle = Math.atan(y / x);
            angle = angle * 180 / Math.PI;
            if(x < 0) 
                if(y < 0) angle = 180 + angle;
                else angle = 180 + angle;
            else if(y < 0) angle = 360 + angle; 
            return angle;
        },
        startRotate(e) {
            let {left, top} = this.$refs.center.getBoundingClientRect();
            let [x, y] = [event.clientX - left, event.clientY - top];
            let angle0 = this.getAngle(x, y);
            this.fireHandler(e => {
                let [x, y] = [event.clientX - left, event.clientY - top];
                let angle1 = this.getAngle(x, y);
                let a = (360 + this.currentSettings.values.angle + (angle1 - angle0)) % 360;
                a = Math.round(a / this.steps.angle) * this.steps.angle;
                this.$store.commit("changeSettings", {
                    tool: this.currentTool,
                    updates: {
                        values: { angle: a }
                    }
                });
                angle0 = angle1;
            });          

        }

    }
}

</script>

<style lang="scss">
@import "../assets/styles/colors";

.brush-transformation {    
    .world-axes {
        margin: 0 auto;
        border: 1px dashed $color-accent3;
        position: relative;    
        & > .x-axis, 
        & > .y-axis {
            border: .5px dashed $color-accent3;
        }    
        .width {
            position: absolute;
            top: 0;
            left: 50%;
            height: 0;
            right: 0;
        }
    }
    .x-axis {
        position: absolute;
        top: 50%;
        left: -5px;
        right: -5px;
        height: 0;
        
    }
    .y-axis {
        position: absolute;
        top: -5px;
        bottom: -5px;
        left: 50%;
        width: 0;
    }
    .shape-axes {
        left: 50%;
        top: 50%;
        position: absolute;
        border : 1px black solid;
        cursor: url("../assets/img/rotate.svg") 8 8, pointer;
        .center {
            position: absolute;
            width: 0;
            height: 0;
            left: 50%;
            top: 50%;
        }
        .x-axis, 
        .y-axis {
            border: .5px solid black;
            z-index: 10;
            cursor: crosshair;
            &:after {
                content: "";
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                border: 3px transparent solid;
                display: block;
                position: absolute;
                z-index: 1;                
            }
        }   
        &.round {
            border-radius: 50%;
        }
        &.texture {
            background-size: 100% 100%;
            background-position: center;
            background-repeat: no-repeat;
            border: none;
        }
    }
}

</style>