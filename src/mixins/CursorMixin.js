export default {
    data() {
        return {
            cursorClasses: []
        }
    },
    methods: {
        setCursor() {
            const {values} = this.currentSettings;
            this.$refs.cursor.style.transform = `translate3d(-50%,-50%,0)`;
            this.$refs.cursor.style.backgroundImage = null;
            this.$refs.cursor.style.backgroundColor = "transparent";
            this.$refs.cursor.style.width = null;
            this.$refs.cursor.style.height = null;
            this.cursorClasses = [];
            if(this.translation) 
                this.cursorClasses = ["grab"];
            
            if(!this.shortcutTool && this.currentSettings.webglTool) {                
                if(this.currentTool == "roller") {
                    this.$refs.cursor.style.height = values.lineWidth  + "px";
                    this.$refs.cursor.style.width = "15px";
                } else {               
                    this.$refs.cursor.style.width = values.diameter * this.zoom  + "px";
                    this.$refs.cursor.style.height = values.diameter * this.zoom  + "px";
                    this.$refs.cursor.style.transform = [ 
                        `translate3d(-50%,-50%,0)`,
                        `rotate(${values.angle + this.rotationAngle}deg)`,                    
                        `scale(${Math.min(1, values.stretch)},${Math.min(1, 1 / values.stretch)})`,
                       
                    ].join("");
                }
                if(this.currentSettings.texture) {
                    this.cursorClasses = ["texture"];
                    this.$refs.cursor.style.backgroundImage = `url(${this.currentSettings.texture.src})`;
                } else  
                    this.cursorClasses = [values.shape];
            }
    
            if(this.currentSettings.modifying && 
                this.currentLayer.locked) 
                this.cursorClasses = ["locked"];       
    
        },
        setCursorColor(color) {
            this.$refs.cursor.style.backgroundColor = color;
        },
        setCursorAngle(tool) {
            let angleDeg = Math.round(tool.cursorAngle() / Math.PI * 180);
            this.$refs.cursor.style.transform = `translate3d(-50%,-50%,0)rotate(${angleDeg}deg)`;
        },
        setCursorPosition() {
            this.$refs.cursor.style.left = this.lastPoint.pageCoords[0] + "px";
            this.$refs.cursor.style.top =  this.lastPoint.pageCoords[1] + "px";
        },
        setCursorSelAction() {
            this.$refs.cursor.style.transform = "translate3d(-50%,-50%,0)";
            if(this.currentSettings.selection) {
                if(this.activeSelection) {
                    let c = this.selection.getCursor(this.lastPoint.coords);
                    this.cursorClasses = [];
                    if(c.resize) {
                        this.cursorClasses.push("resize");
                        this.setCursorAngle(this.selection);                 
                    } 
                    if(c.rotate) {
                        this.cursorClasses.push("rotate");
                    }    
                } else {
                    this.cursorClasses = [];
                }
            }
        },
    }
}