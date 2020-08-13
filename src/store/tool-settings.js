export default {
    picker: { 
        values: {}
    },
    hand: {
        values: {}
    },
    brush: {
        values: {
            radius: 50,
            opacity: 1,
            spacing: .05,  
            angle: 0,
            stretch: 1,
            shape: "round",
            hardness: 1,
            overlay: false,
            pixel: false,      
            texture: false,
            gradient: {enabled: false, type: "by_len", length: 100}
        },
        webglTool: "brush",
        dynamics: {
            radius:  {type: 0, length: 100, range: 1},
            opacity: {type: 0, length: 100, range: 1},
            stretch: {type: 0, length: 100, range: 1},
            angle:   {type: 0, length: 100, range: 1},
        },
        textype: "brush",  
        gradientTypes: ['by_len', 'radial']              
    },
    eraser: {
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
            texture: false,
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
        values: {
            tolerance: 30,
            pattern: {enabled: false, scale: 1}
        }
    },
    marker: {
        values: {
            lineWidth: 20,
            blurRadius: 5,
            angleSmoothing: 10,
            curveSmoothing: 3,
            opacity: 1,
            texture: false,
            gradient: {enabled: false, type: "by_len", length: 100}
        },
        webglTool: "marker",
        dynamics: {
            lineWidth: {type: 0, length: 100, range: 1},
            opacity:   {type: 0, length: 100, range: 1},
        },             
        textype: "marker",
        gradientTypes: ['by_len', 'by_wid']   
    },
    pen: {
        values: {}
    },
    selection_rect: {
        values: {}
    },
    selection_polygon: {
        values: {}
    },
    selection_lasso: {
        values: {}
    }
};