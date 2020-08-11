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
            stretch: 0,
            shape: "round",
            hardness: 1,
            overlay: false,
            pixel: false,      
            texture: false,
            gradient: {enabled: false, type: "by_len", length: 100}
        },
        webglTool: "brush",
        dynamics: {
            radius: {type: 0, length: 100, range: 1},
            opacity: {type: 0, length: 100, range: 1},
            stretch:  {type: 0, length: 100, range: 1},
            angle: {type: 0, length: 100, range: 1},
        },
        textype: "brush",  
        gradientsTypes: ['by_len', 'radial']              
    },
    eraser: {
        values: {
            radius: 50,
            opacity: 1,
            spacing: .05,  
            angle: 0,
            stretch: 0,
            hardness: 1,
            shape: "round",
            overlay: false,
            pixel: false,      
            texture: false,
            gradient: {enabled: false}
        },
        webglTool: "brush",
        dynamics: {
            radius: {type: 0, length: 100, range: 1},
            opacity: {type: 0, length: 100, range: 1},
            stretch:  {type: 0, length: 100, range: 1},
            angle: {type: 0, length: 100, range: 1},
        },
        textype: "brush",     
        gradientTypes: ['by_len', 'by_wid']   
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
            lineWidth: {type: 2, length: 100, range: 1},
            opacity: {type: 2, length: 100, range: 1},
        },             
        textype: "marker",
    },
    pen: {
        values: {}
    },
    selection_rect: {},
    selection_polygon: {},
    selection_lasso: {}
};