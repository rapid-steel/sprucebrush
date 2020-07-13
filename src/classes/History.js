export default class History {
    constructor(size) {
      this.size = size;
      this.array = new Array(size);
      this.index = 0;
    }
    append(el) {
      this.array[this.index] = el;
      this.index = (this.index+1) % this.size;
    }
    get() {
      return this.array[this.index];
    }
    remove() {
      this.index--;
      if(this.index < 0) {
        this.index = this.size - 1;
      }
      const el = this.array[this.index];
      if(el) {
        this.array[this.index] = null;
      } else {
        this.index = 0;
      }
      return el;
    }
  }