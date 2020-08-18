export default class History {
    constructor(size = 10) {
        this.size = size;
        this.array = new Array(size);
        this.index = this.size-1;
    }
    setSize(size) {
        this.size = size;
    }
    put(el) {
        this.array[this.index] = el;      
    }
    get() {
        return this.array[this.index];
    }
    back() {
        this.index = (this.index||this.size) - 1;
    }
    forward() {
        this.index = (this.index+1) % this.size;
    }
    clear() {
        this.array = new Array(this.size);
        this.index = this.size-1;
    }
}