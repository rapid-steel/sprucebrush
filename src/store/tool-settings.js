export default {
    picker: { 
        values: {}
    },
    hand: {
        values: {}
    },
    rotation: {
        values: {
            rAngle: 0
        }
    },
    brush: {
        modifying: true,
        drawing: true,
        values: {
            radius: 50,
            opacity: 1,
            spacing: .05,  
            angle: 0,
            stretch: 1,
            hardness: 1,
            shape: "round",
            overlay: false,
            pixel: false,     
        },
        smoothing: {},
        texture: false,
        gradient: {
            enabled: false, 
            type: "by_len", 
            length: 100
        },
        webglTool: "brush",
        dynamics: {
            radius:  {type: 0, length: 100, range: 1},
            opacity: {type: 0, length: 100, range: 1},
            stretch: {type: 0, length: 100, range: 1},
            angle:   {type: 0, length: 100, range: 1},
            hue:        {type: 0, length: 100, range: 1},
            saturation: {type: 0, length: 100, range: 1},
            lightness:  {type: 0, length: 100, range: 1},
        },
        textype: "brush",  
        gradientTypes: ['by_len', 'radial']              
    },
    eraser: {
        modifying: true,
        drawing: true,
        smoothing: {},
        values: {
            radius: 50,
            opacity: 1,
            spacing: .05,  
            hardness: 1,
            angle: 0,
            stretch: 1,
            shape: "round",
            overlay: false,
            pixel: false,      
        },
        webglTool: "brush",
        dynamics: {
            radius: {type: 0, length: 100, range: 1},
            opacity: {type: 0, length: 100, range: 1},
            stretch:  {type: 0, length: 100, range: 1},
            angle: {type: 0, length: 100, range: 1},
        },
        textype: "brush",     
        gradientTypes: []   
    },
    fill: {
        modifying: true,
        drawing: true,
        values: {
            tolerance: 30,
        },
        pattern: {enabled: false, scale: 1}
    },
    marker: {
        modifying: true,
        drawing: true,
        values: {
            lineWidth: 20,
            blurRadius: 5,
            opacity: 1,
            hardness: 1,
        },
        smoothing: {
            curve: 10,
            angle: 3
        },
        texture: false,
        gradient: {
            enabled: false, 
            type: "by_len", 
            length: 100
        },
        webglTool: "marker",
        dynamics: {
            lineWidth: {type: 0, length: 100, range: 1},
            opacity:   {type: 0, length: 100, range: 1},
            hue:        {type: 0, length: 100, range: 1},
            saturation: {type: 0, length: 100, range: 1},
            lightness:  {type: 0, length: 100, range: 1},
        },             
        textype: "marker",
        gradientTypes: ['by_len', 'by_wid']   
    },
    pen: {
        modifying: true,
        values: {}
    },
    selection_rect: {
        modifying: true,
        selection: true,
        type: "rect",
        values: {}
    },
    selection_polygon: {
        modifying: true,
        selection: true,
        type: "polygon",
        values: {}
    },
    selection_lasso: {
        modifying: true,
        selection: true,
        type: "lasso",
        values: {}
    }
};