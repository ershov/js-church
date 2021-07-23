#!/usr/bin/env node

DEBUG = true
LOG = (msg, x) => { DEBUG && console.log("DEBUG", msg, x); return x; }

let church = `

ZERO  =( f => ( x => x     ) )
ONE   =( f => ( x => f(x)    ) )
TWO   =( f => ( x => f(f(x))   ) )
THREE =( f => ( x => f(f(f(x)))  ) )

TIMES =( n => ( f => ( x => n(f)(x) ) ) )
SUCC  =( n => ( f => ( x => f(n(f)(x)) ) ) )

ADD       =( m => ( n => ( f => ( x => m(f)(n(f)(x)) ) ) ) )
MULTIPLY  =( m => ( n => ( f => m(n(f)) ) ) )
POWER     =( m => ( n => n(m) ) )
PRED      =( n => ( f => ( x => n( g => ( h => h(g(f)) ) )( y => x )( y => y ) ) ) )
SUBTRACT  =( m => ( n => n(PRED)(m) ) )

// Booleans

TRUE  =( x => ( y => x ) )
FALSE =( x => ( y => y ) )
IF    =( b => b )

NOT =( b => ( x => ( y => b(y)(x) ) ) )
AND =( a => ( b => a(b)(a) ) )
OR  =( a => ( b => a(a)(b) ) )

// Natural numbers with booleans

IS_ZERO           =( n => n( x => FALSE )(TRUE) )
IS_LESS_OR_EQUAL  =( m => ( n => IS_ZERO(SUBTRACT(m)(n)) ) )
IS_EQUAL          =( m => ( n => AND(IS_LESS_OR_EQUAL(m)(n))(IS_LESS_OR_EQUAL(n)(m)) ) )

// Combinators

Y =( f => ( x => f(       x(x)     ) )( x => f(       x(x)     ) ) ) // the famous one, for lazy languages like Haskell
Z =( f => ( x => f(  v => x(x)(v)  ) )( x => f(  v => x(x)(v)  ) ) ) // eta-expanded Y combinator, for eager languages like Ruby

// Natural numbers with recursion

FACTORIAL = Z( f => ( n => IF(IS_ZERO(n))(ONE)( v => MULTIPLY(n)(f(PRED(n)))(v) ) ) )
DIV       = Z( f => ( m => ( n => IF(IS_LESS_OR_EQUAL(n)(m))( v => SUCC(f(SUBTRACT(m)(n))(n))(v) )(ZERO) ) ) )
MOD       = Z( f => ( m => ( n => IF(IS_LESS_OR_EQUAL(n)(m))( v => f(SUBTRACT(m)(n))(n)(v) )(m) ) ) )

// Pairs

PAIR    =( x => ( y => ( f => f(x)(y) ) ) )
FIRST   =( p => p( x => ( y => x ) )  )
SECOND  =( p => p( x => ( y => y ) )  )

// Lists

NIL     =( f => ( x => x ) )
CONS    =( x => ( l => ( f => ( y => f(x)(l(f)(y)) ) ) ) )
IS_NIL  =( k => k( x => ( l => FALSE ))(TRUE) )
HEAD    =( k => k( x => ( l => x ) )(NIL) )
TAIL    =( l => FIRST(l( x => ( p => PAIR(SECOND(p))(CONS(x)(SECOND(p))) ) )(PAIR(NIL)(NIL))) )

FOLD_LEFT   = Z( f => ( g => ( x => ( l => IF(IS_NIL(l))(x)( v => f(g)(g(HEAD(l))(x))(TAIL(l))(v) ) ) ) ) )
FOLD_RIGHT  =( f => ( x => ( l => l(f)(x) ) ) )
MAP         =( f => FOLD_RIGHT( x => CONS(f(x)) )(NIL) )

RANGE   = Z( f => ( m => ( n => IF(IS_LESS_OR_EQUAL(m)(n))( v => CONS(m)(f(SUCC(m))(n))(v) )(NIL) ) ) )
SUM     = FOLD_LEFT(ADD)(ZERO)
PRODUCT = FOLD_LEFT(MULTIPLY)(ONE)
APPEND  =( k => ( l => FOLD_RIGHT(CONS)(l)(k) ) )
PUSH    =( x => ( l => APPEND(l)(CONS(x)(NIL)) ) )
REVERSE = FOLD_RIGHT(PUSH)(NIL)

INCREMENT_ALL = MAP(SUCC)
DOUBLE_ALL    = MAP(MULTIPLY(TWO))

// Natural numbers with lists

FOUR      = SUCC(THREE)
FIVE      = SUCC(FOUR)
SIX       = MULTIPLY(THREE)(TWO)
SEVEN     = SUCC(SIX)
EIGHT     = POWER(TWO)(THREE)
NINE      = MULTIPLY(THREE)(THREE)
TEN       = SUCC(NINE)
RADIX     = (x => TEN(x))  // TEN -- avoid identity
TO_DIGITS = Z( f => ( n => PUSH(MOD(n)(RADIX))(IF(IS_LESS_OR_EQUAL(n)(PRED(RADIX)))(NIL)( v => f(DIV(n)(RADIX))(v) ) ) ) )
TO_CHAR   =( n => n ) // assume string encoding where 0 encodes '0', 1 encodes '1' etc
TO_STRING =( n => MAP(TO_CHAR)(TO_DIGITS(n)) )

// FizzBuzz

FIFTEEN = MULTIPLY(THREE)(FIVE)
HUNDRED = MULTIPLY(TEN)(TEN)
FIZZ    = MAP(ADD(RADIX))(CONS(ONE)(CONS(TWO)(CONS(FOUR)(CONS(FOUR)(NIL)))))
BUZZ    = MAP(ADD(RADIX))(CONS(ZERO)(CONS(THREE)(CONS(FOUR)(CONS(FOUR)(NIL)))))

FIZZBUZZ =
  (m => MAP( n =>
    IF(IS_ZERO(MOD(n)(FIFTEEN)))(
      APPEND(FIZZ)(BUZZ)
    )(IF(IS_ZERO(MOD(n)(THREE)))(
      FIZZ
    )(IF(IS_ZERO(MOD(n)(FIVE)))(
      BUZZ
    )(
      TO_STRING(n)
    )))
  )(RANGE(ONE)(m)))

`;

eval(church);

///////////////////////////////////////////////////////////////////////////

// Making it useful:

var funcs = {};
function GenSourcesMap() {
  var NestLevel = s =>
    (s.match(/\(/g) || []).length -
    (s.match(/\)/g) || []).length;
  let multiline = null;
  for (let line of church.split(/\n|;/)) {
    line = line.replace(/\/\/.*/, "");
    if (multiline) {
      multiline.body += line;
      multiline.nest += NestLevel(line);
      if (!multiline.nest) {
        funcs[multiline.name] = multiline.body;
        eval(multiline.name).name2 = multiline.name;
        multiline = null;
      }
      continue;
    }

    let assign = line.match("^([^=]+)=(.*)$", 2);
    if (!assign) continue;
    let [_, key, val] = assign.map(x => x.trim());
    let nest = (val && NestLevel(val)) || 0;
    if (key && val && nest == 0) {
      funcs[key] = val;
      eval(key).name2 = key;
    } else {
      // multiline...
      multiline = {
        name: key,
        nest: nest,
        body: val || "",
      };
    }
  }
}
GenSourcesMap();
//console.log(funcs);

function FuncSourceFromName(fn_name) {
  let ret = funcs.hasOwnProperty(fn_name) ? funcs[fn_name] : `${eval(fn_name)}`;
  //console.log(`  s source ${fn_name} -> ${ret}`);
  return ret;
}
function FuncSourceFromCode(fn) {
  let ret = fn.name && funcs.hasOwnProperty(fn.name) ? funcs[fn.name] :
            fn.name2 && funcs.hasOwnProperty(fn.name2) ? funcs[fn.name2] :
            `${fn}`;
  //console.log(`  c source ${fn.name}:${fn.name2}: ${fn}: ${ret}`);
  return ret;
}
function FuncSource(fn) {
  return ((typeof fn == "string") ? FuncSourceFromName : FuncSourceFromCode)(fn);
}

_TO_INTEGER = (f => f(n => ++n)(+[]))
_TO_BOOLEAN = (f => f(!![])(![]))
_TO_BOOLEAN2 = (f => IF(f)(!![])(![]))
_TO_ARRAY0 = (f => {
  let array = [];
  while (!_TO_BOOLEAN(IS_NIL(f))) {
    array.push(HEAD(f));
    f = TAIL(f);
  }
  return array;
})
_TO_ARRAY2 = (f => _TO_BOOLEAN(IS_NIL(f))? [] : [HEAD(f), ..._TO_ARRAY2(TAIL(f))])
_TO_ARRAY3 = x => (Z(f => (a => _TO_BOOLEAN(IS_NIL(a))? [] : [HEAD(a), ...f(TAIL(a))])))(x); // cover application of Z
_TO_ARRAY = _TO_ARRAY3
_TO_CHAR = (c => '0123456789BFiuz'[_TO_INTEGER(c)])
_TO_STRING = (s => _TO_ARRAY(s).map(_TO_CHAR).join(""))

//console.log(0, _TO_INTEGER(ZERO))
//console.log(10, _TO_INTEGER(TEN))
//console.log(true, _TO_BOOLEAN(TRUE))
//console.log(false, _TO_BOOLEAN(FALSE))
//console.log(true, _TO_BOOLEAN(IS_ZERO(ZERO)))
//console.log(false, _TO_BOOLEAN(IS_ZERO(TEN)))
//console.log(2, _TO_INTEGER(SUBTRACT(FIVE)(THREE)))
//console.log(0, _TO_INTEGER(SUBTRACT(THREE)(FIVE)))
//console.log(2, _TO_INTEGER(DIV(TEN)(FIVE)))
//console.log(1, _TO_INTEGER(MOD(THREE)(TWO)))
//console.log(_TO_ARRAY0(RANGE(ONE)(TEN)).map(_TO_INTEGER))
//console.log(_TO_ARRAY2(RANGE(ONE)(TEN)).map(_TO_INTEGER))
//console.log(_TO_ARRAY3(RANGE(ONE)(TEN)).map(_TO_INTEGER))
//console.log(_TO_STRING(RANGE(ONE)(TEN)))
//console.log(_TO_STRING(FIZZ))
//console.log(_TO_ARRAY(FIZZBUZZ(HUNDRED)).map(_TO_STRING))

// Heuristics for building integers:
// a+b ... a+a
// a*b ... a*a
// a**b ... a**a
// 10**(number) ...

_FROM_INTEGER_BUILD_ADD = n => {
  _gen_plain_num = n => `( f => ( x => ${"f(".repeat(n)}x${")".repeat(n)} ) )`;
  if (n <= 10) return "("+["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"][n < 0 ? 0 : n]+")";
  let n1 = Math.floor(n/2);
  let n2 = n - n1;
  if (n2 == 1) return `(SUCC${_FROM_INTEGER_BUILD_ADD(n1)})`;
  if (n2 == 2) return `(SUCC(SUCC${_FROM_INTEGER_BUILD_ADD(n1)}))`;
  if (n1 == n2) return `(MULTIPLY${_FROM_INTEGER_BUILD(n1)}(TWO))`;
  return `(ADD${_FROM_INTEGER_BUILD(n1)}${_FROM_INTEGER_BUILD(n2)})`;
};
_INTEGER_BUILD_INC_BY = (n, inc) => {
  if (inc <= 4) return `${"(SUCC".repeat(inc)}${n}${")".repeat(inc)}`;
  return `(ADD${n}${_FROM_INTEGER_BUILD(inc)})`;
};
_FROM_INTEGER_BUILD_MUL = n => {
  let sqrt = Math.floor(Math.sqrt(n));
  let [arg1, arg2, n_next] =
    [ [0,0], [0, 1], [1, 0], [1, 1] ].
    map(([i1, i2]) => [sqrt + i1, sqrt + i2]).
    map(([a1, a2]) => [a1, a2, a1 * a2]).
    filter(([,,nn]) => nn <= n).
    reduce((a1, a2) => a1[2] > a2[2] ? a1 : a2);
  if (arg1 == arg2) return _INTEGER_BUILD_INC_BY(`(POWER${_FROM_INTEGER_BUILD(arg1)}(TWO))`, n - n_next);
  return _INTEGER_BUILD_INC_BY(`(MULTIPLY${_FROM_INTEGER_BUILD(arg1)}${_FROM_INTEGER_BUILD(arg2)})`, n - n_next);
};
_FROM_INTEGER_BUILD_POW = n => {
  let powdiff = (n, pow) => {
    let root = Math.floor(Math.round(n**(1/pow) * 100)/100);
    return [n - root**pow, root, pow];
  };
  let [diff, root, pow] =
    [2,3,4,5,6,7,8,9,10].
    map(pow => powdiff(n, pow)).
    filter(a => a[0] >= 0 && a[1] > 1).
    reduce((a1, a2) => Math.max(...a1) < Math.max(...a2) ? a1 : a2);
  return _INTEGER_BUILD_INC_BY(`(POWER${_FROM_INTEGER_BUILD(root)}${_FROM_INTEGER_BUILD(pow)})`, diff);
};
_FROM_INTEGER_BUILD = n => {  // Simple version
  if (n <= 20) return _FROM_INTEGER_BUILD_ADD(n);
  if (n < 100) return _FROM_INTEGER_BUILD_MUL(n);
  return _FROM_INTEGER_BUILD_POW(n);
};
fill = (sz, val) => [...Array(sz)].fill(val);
seq = (from, to) => [...new Array(to - from + 1)].map((x,i) => i + from);
_FROM_INTEGER_BUILD = (()=>{  // A more efficient version
  const LIMIT = 1000;
  let op_tab = [["ZERO"], ["ONE"], ["TWO"], ["THREE"], ["FOUR"], ["FIVE"], ["SIX"], ["SEVEN"], ["EIGHT"], ["NINE"], ["TEN"]];
  for (let i of seq(2, 10))
    for (let j of seq(2, 10))
      if (i**j < LIMIT)
        op_tab[i**j] || (op_tab[i**j] = ["POWER", i, j]);
      else
        break;
  for (let lim of seq(2, Math.ceil(LIMIT**0.5)))
    for (let i = lim, j = 2; i >= 2; i--,j++)
      if (i*j < LIMIT)
        (!op_tab[i*j] && !(op_tab[i*j-1] && op_tab[i*j-1][0] == "POWER")) && (op_tab[i*j] = ["MULTIPLY", i, j]);
      else
        break;
  //console.log(op_tab);
  return num => {
    if (num >= LIMIT) return _FROM_INTEGER_BUILD_POW(num);
    let n;
    for (n = num; !op_tab[n]; n--) { }
    return _INTEGER_BUILD_INC_BY(
        "(" + op_tab[n][0] + op_tab[n].slice(1).map(_FROM_INTEGER_BUILD).join("") + ")",
      num - n);
  };
})();
_FROM_INTEGER = n => eval("x => "+_FROM_INTEGER_BUILD(n)+"(x)");

function EnsureOuterParens(str) {
  // Are there parens outside?
  if (!str.match(/^\s*\(/) || !str.match(/\)\s*$/)) return `(${str})`;
  // Does depth drop to zero inside?
  let depth = 0
  let ok = true;
  str.match(/[()]/g).map(x => +{"(":1,")":-1}[x]).forEach((increment, i) => {
    if (i != 0 && depth == 0) { ok = false; }
    depth += increment;
  });
  return ok ? str : `(${str})`;
}
_GENERATE_CODE = f => {
  f = FuncSource(f);
  while (f.match(/\b[A-Z_]+\b/)) {
    //console.log(">>>", f);
    f = f.replace(/\b[A-Z_]+\b/, x=>_GENERATE_CODE(x));
    //console.log("<<<", f);
  }
  // All functions must have outer ()s to secure their application order!
  return EnsureOuterParens(f.replace(/\s/msg, ""));
};

console.log(_GENERATE_CODE(()=>_TO_INTEGER(TEN)))
console.log(_GENERATE_CODE("_TO_INTEGER(TEN)"))
console.log(_GENERATE_CODE(()=>_TO_CHAR(TEN)))

console.log("Source:", _FROM_INTEGER_BUILD_ADD(10));
NUM = _FROM_INTEGER(10);  // Make NUM expandable by code generator
console.log("NUM:", `${NUM}`);
console.log("int:", `${_TO_INTEGER(NUM)}`);

_TEST_NUM = n => {
  NUM = _FROM_INTEGER(n)
  console.log(`
NUM: ${n}
SOURCE: ${_FROM_INTEGER_BUILD(n)}
NUM: ${NUM}
int: ${_TO_INTEGER(NUM)}
code: ${_GENERATE_CODE(NUM)}
ncode: ${_GENERATE_CODE(()=>_TO_INTEGER(NUM))}`);
}

_TEST_NUM(5);
_TEST_NUM(10);
_TEST_NUM(32);
_TEST_NUM(48);
_TEST_NUM(65);
_TEST_NUM(97);
_TEST_NUM(100);
_TEST_NUM(150);
_TEST_NUM(160);
_TEST_NUM(222);
_TEST_NUM(300);
_TEST_NUM(345);
_TEST_NUM(999);
_TEST_NUM(100000);
_TEST_NUM(12345678);

_TEST = (x, f) => {
  console.log(`
${x} -> ${f()}
${f}
${_GENERATE_CODE(f)}`);
}

console.log();
console.log(`TEN: ${FuncSource(TEN)}`);
console.log(`SUCC: ${FuncSource(SUCC)}`);
console.log(`_TO_ARRAY: ${FuncSource(_TO_ARRAY)}`);


NUM = _FROM_INTEGER(5);  // Make NUM expandable by code generator
console.log(`NUM: ${FuncSource(NUM)}`);
_TEST(5, ()=>(_TO_INTEGER(NUM)))

_TEST(0, ()=>(_TO_INTEGER(ZERO)))
console.log(`ZERO: ${FuncSource(ZERO)}`)
_TEST(1, ()=>(_TO_INTEGER(ONE)))
console.log(`ONE: ${FuncSource(ONE)}`)
_TEST(2, ()=>(_TO_INTEGER(TWO)))
console.log(`TWO: ${FuncSource(TWO)}`)
_TEST(3, ()=>(_TO_INTEGER(THREE)))
_TEST(4, ()=>(_TO_INTEGER(FOUR)))
console.log(`FOUR: ${FuncSource(FOUR)}`)
_TEST(4, ()=>(_TO_INTEGER(ADD(TWO)(TWO))))
_TEST(4, ()=>(_TO_INTEGER(MULTIPLY(TWO)(TWO))))
_TEST(5, ()=>(_TO_INTEGER(FIVE)))
console.log(`FIVE: ${FuncSource(FIVE)}`)
_TEST(5, ()=>(_TO_INTEGER(ADD(TWO)(THREE))))
_TEST(5, ()=>(_TO_INTEGER(ADD(THREE)(TWO))))
_TEST(5, ()=>(_TO_INTEGER(ADD(FIVE)(ZERO))))
_TEST(5, ()=>(_TO_INTEGER(ADD(ZERO)(FIVE))))
_TEST(5, ()=>(_TO_INTEGER(MULTIPLY(FIVE)(ONE))))
_TEST(5, ()=>(_TO_INTEGER(MULTIPLY(ONE)(FIVE))))
_TEST(10, ()=>(_TO_INTEGER(TEN)))
console.log(`TEN: ${FuncSource(TEN)}`)
_TEST(true, ()=>(_TO_BOOLEAN(TRUE)))
_TEST(false, ()=>(_TO_BOOLEAN(FALSE)))
_TEST(true, ()=>(_TO_BOOLEAN(IS_ZERO(ZERO))))
_TEST(false, ()=>(_TO_BOOLEAN(IS_ZERO(TEN))))
_TEST(2, ()=>(_TO_INTEGER(SUBTRACT(FIVE)(THREE))))
_TEST(0, ()=>(_TO_INTEGER(SUBTRACT(THREE)(FIVE))))
_TEST(2, ()=>(_TO_INTEGER(DIV(TEN)(FIVE))))
_TEST(1, ()=>(_TO_INTEGER(MOD(THREE)(TWO))))
_TEST("[1..10]", ()=>(_TO_ARRAY(RANGE(ONE)(TEN)).map(_TO_INTEGER)))
_TEST("'0..9'", ()=>(_TO_ARRAY(RANGE(ZERO)(SUBTRACT(TEN)(ONE))).map(_TO_INTEGER).join("")))
_TEST("'1...'", ()=>(_TO_STRING(RANGE(ONE)(TEN))))
_TEST("Fizz", ()=>(_TO_STRING(FIZZ)))
_TEST("FizzBuzz(100)", ()=>(_TO_ARRAY(FIZZBUZZ(HUNDRED)).map(_TO_STRING)))

