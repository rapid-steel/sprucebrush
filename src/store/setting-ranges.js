export default Object.freeze({
    values: {
        radius:    {min: 1,    max: 1000, step: 1,   icon: require("../assets/img/diameter.png")},
        lineWidth: {min: 1,    max: 1000, step: 1,   icon: require("../assets/img/linewidth.png")},    
        opacity:   {min: .01,  max: 1,    step: .01, icon: require("../assets/img/opacity.png")},
        hardness: {min: .01, max: 1, step: .01, icon: require("../assets/img/hardness.png")},
        spacing:   {min: .01,  max: 10,   step: .01, icon: require("../assets/img/spacing.png")},  
        tolerance: {min: 1,    max: 255,  step: 1 },
        angle:     {min: 0,    max: 359,  step: 1,   icon: require("../assets/img/angle.png")},   
        stretch:   {min: .001, max: 100,  step: .001,icon: require("../assets/img/stretch.png")},   
        rAngle: {min: 0,    max: 359,  step: 1, resetTo: 0},
        hue: {icon: require("../assets/img/hue.png")},
        saturation: {icon: require("../assets/img/saturation.png")},
        lightness: {icon: require("../assets/img/lightness.png")}
    },
    smoothing: {
        curve: {min: 1, max: 25, step: 1},
        angle: {min: 1, max: 25, step: 1},
    },
    gradient: {
        length: {min: 1, max: 1000, step: 1, icon: require("../assets/img/linewidth.png") },
        types: {
            by_len: {icon: require("../assets/img/gradient_by_len.png")},
            by_wid: {icon: require("../assets/img/gradient_by_wid.png")},
            radial: {icon: require("../assets/img/gradient_radial.png")}
        }
    },
    pattern: {
        scale: {min: .01, max: 100, step: .01 }
    },
    dynamics: {
        props: {
            length: {min: 1, max: 1000, step: 1},
            range: { min: .01, max: 1, step: .01},
        },
        types: {
            0: {n: 0, props: "all", k: "disabled"},
            1: {n: 1, props: ["lineWidth", "radius", "opacity", "stretch", "angle"], k: "fade", length: true},
            2: {n: 2, props: "all", k: "periodic_max", length: true, range: 1},
            3: {n: 3, props: ["lineWidth", "radius", "opacity", "stretch", "hue", "saturation", "lightness"], k: "pressure", length: true, range: 1},
            4: {n: 4, props: ["stretch"], k: "periodic_ampl", length: true, range: 1},
            5: {n: 5, props: ["angle"], k: "circular", length: true},
            6: {n: 6, props: "all", k: "random", range: true}
        }               
    }               
});