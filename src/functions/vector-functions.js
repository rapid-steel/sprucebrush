

export function rotateX(vec1, vec2) {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1];
  }
  
export function rotateY(vec1, vec2) {
    return -vec1[1] * vec2[0] + vec1[0] * vec2[1];
  }


export function equal(vec1, vec2) {

    return vec1[0] == vec2[0] && vec1[1] == vec2[1];
}

export function normal(vec1) {
      let d = Math.sqrt(vec1[0]*vec1[0] + vec1[1]*vec1[1]);
      return [ 
          vec1[1] / d, 
          - vec1[0] / d
        ];
  }

export function vec(p1, p2) {
      return [
          p2[0] - p1[0],
          p2[1] - p1[1]
      ];
  }

export function invert(vec1) {
      return [ - vec1[0], -vec1[1] ];
  }

export function sum(vec1, vec2) {
      return [
          vec1[0] + vec2[0],
          vec1[1] + vec2[1]
      ];
  }

export function normalized(vec1) {
    let d = Math.sqrt(vec1[0]*vec1[0] + vec1[1]*vec1[1]);
      return [ 
          vec1[0] / d, 
          vec1[1] / d
        ];
      
  }

export function dot(vec1, vec2) {
      return vec1[0] * vec2[0] + vec1[1] * vec2[1];
  }
export function length(vec1) {
      return  Math.sqrt(vec1[0] * vec1[0] + vec1[1] * vec1[1] );
  }

export function angle(vec1, vec2) {
      return Math.acos(
            dot(normalized(vec1), normalized(vec2))
        );
  }