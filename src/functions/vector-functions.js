

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
    if(!d) return [0, 0];
    else
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

function vec_angle(vec) {
  return Math.atan(vec[1] / vec[0]) + (vec[0] < 0 ? Math.PI : 0);
}

export function angle_signed(vec1, vec2) {
   return vec_angle(vec2) - vec_angle(vec1);
}

export function average(vec1, vec2) {
  let len = (length(vec1) + length(vec2)) / 2;
  return normalized(
    sum(vec1, vec2)
  ).map(n => n * len);      
}