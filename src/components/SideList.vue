<template>
    <div class="side-list" :class="{open}">
        <div class="arrow" @click="toggle"></div>
        <div class="expanded-list" @click.stop>
            <div class="content">
                <slot />
            </div>
            <div class="footer">
                <slot name="footer" />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        value: { type: Number },
        min: { default: 1 },
        max: { default: 100 },
        step: { default: 1 },
        horizontal: { type: Boolean, default: false }
    },
    data() {
        return {
            open: false
        }
    },
    methods: {
        toggle(e) {
            e.preventDefault();
            this.open = !this.open;
            if(this.open) {
                requestAnimationFrame(() => {
                    this.h = this.toggle.bind(this);
                    document.addEventListener("click", this.h);
                });
            } else {
                document.removeEventListener("click", this.h);
            }
        }
    }
};
</script>

<style lang="scss">
@import "../assets/styles/colors";

.side-list {
    position: relative;
    display: inline-block;
    .arrow {
        background-image: url("../assets/img/triagle-right.png");
        background-size: 60%;
        background-position: center;
        background-repeat: no-repeat;
        width: 20px;
        height: 30px;
    }
    .expanded-list {
        position: absolute;
        display: none;
        left: 100%;
        top: 0;
        min-width: 240px;
        z-index: $z-index_side-list;
        border: 1px solid black;
        background: $color-bg;
        .content {
            display: flex;
            max-width: 100%;
            width: calc(100% - 10px);
            max-height: 300px;
            overflow-y: auto;
            margin: 5px;        
            flex-wrap: wrap;        
            justify-content: space-around;
        }
        .footer {
            width: 100%;
            background: $color-bg;
        }
    }
    &.open {
        .arrow {
            transform: scale(-1, 1);
        }
        .expanded-list {
            display: block;
        }
    }
}

</style>