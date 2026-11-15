/** Disjoint nonempty stars: each component needs exactly one dominating vertex. */
export function constructGraph(n,gamma){
 if(!Number.isInteger(n)||n<2||n>10||!Number.isInteger(gamma)||gamma<1||gamma>n)throw Error('تعداد رأس باید صحیح بین ۲ تا ۱۰ و گاما بین ۱ تا تعداد رأس باشد.');
 const vertices=Array.from({length:n},(_,i)=>String.fromCharCode(97+i)),edges=[];
 for(let i=gamma;i<n;i++)edges.push([vertices[(i-gamma)%gamma],vertices[i]]);
 return{n,vertices,edges};
}
