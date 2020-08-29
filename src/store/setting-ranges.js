export default Object.freeze({
    values: {
        diameter:    {min: 1,    max: 1000, step: 1,   icon: "diameter"},
        lineWidth: {min: 1,    max: 1000, step: 1,   icon: "linewidth"},    
        opacity:   {min: .01,  max: 1,    step: .01, icon:"opacity"},
        flow:   {min: .01,  max: 1,    step: .01, icon: "flow"},
        hardness: {min: .01, max: 1, step: .01, icon: "hardness"},
        spacing:   {min: .01,  max: 10,   step: .01, icon: "spacing"},  
        scatter:   {min: 0,  max: 1,   step: .01, icon: "scatter"},  
        tolerance: {min: 1,    max: 255,  step: 1 },
        angle:     {min: 0,    max: 359,  step: 1,   icon: "angle"},   
        stretch:   {min: .01, max: 100,  step: .01, icon: "stretch"},   
        rAngle: {min: 0,    max: 359,  step: 1, resetTo: 0},
        hue: {icon: "hue"},
        saturation: {icon: "saturation"},
        lightness: {icon: "lightness"}
    },
    smoothing: {
        curve: {min: 1, max: 25, step: 1},
        angle: {min: 1, max: 25, step: 1},
    },
    gradient: {
        length: {min: 1, max: 1000, step: 1, icon: "linewidth" },
        types: {
            by_len: {icon: "gradient_by_len"},
            by_wid: {icon: "gradient_by_wid"},
            radial: {icon: "gradient_radial"}
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
            1: {n: 1, props: ["diameter", "opacity", "stretch", "angle"], k: "fade", length: true},
            2: {n: 2, props: ["lineWidth", "diameter", "opacity", "angle", "stretch", "hue", "saturation", "lightness"], k: "periodic_max", length: true, range: 1},
            3: {n: 3, props: ["lineWidth", "diameter", "opacity", "stretch", "hue", "saturation", "lightness"], k: "pressure", length: true, range: 1},
            4: {n: 4, props: ["stretch"], k: "periodic_ampl", length: true, range: 1},
            5: {n: 5, props: ["angle"], k: "circular", length: true},
            6: {n: 6, props: "all", k: "random", range: true}
        }               
    }               
});