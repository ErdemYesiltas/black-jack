export function RandomNumber(min = 0, max = 100) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}