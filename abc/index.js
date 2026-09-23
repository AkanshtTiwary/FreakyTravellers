const obj1={
    name:"Shambhu",
    age:28,
    salary: 24000,
    insta:{
        acc1:"sham001",
        acc2:"vk18",
        acc3:[1,2,3,4],
        ac4:{

        }
    }
}


// const obj2={...obj1};
// obj2.insta.acc2="moon";
// console.log(obj1);
// console.log(obj2);


function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;


if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

const original = { a: 1, b: { c: 2 } };
const deepCopy = deepClone(original);

deepCopy.b.c=3;

console.log(original);
console.log(deepCopy);