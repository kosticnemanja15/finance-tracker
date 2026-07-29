

export const transactions = [];


// Guard je OVDE kritičan: Math.max(...[]) → -Infinity.
// Prazan niz → kreni od 1.
let _nextId = transactions.length > 0 
  ? Math.max(...transactions.map(t => t.id)) + 1
  : 1;

 export function getNextId(){
    return _nextId++;
 } 