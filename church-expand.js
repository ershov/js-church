ZERO=`(f=>(x=>x))`;
ONE=`(f=>(x=>f(x)))`;
TWO=`(f=>(x=>f(f(x))))`;
THREE=`(f=>(x=>f(f(f(x)))))`;

TIMES=`(n=>(f=>(x=>n(f)(x))))`;
SUCC=`(n=>(f=>(x=>f(n(f)(x)))))`;

ADD=`(m=>(n=>(f=>(x=>m(f)(n(f)(x))))))`;
MULTIPLY=`(m=>(n=>(f=>m(n(f)))))`;
POWER=`(m=>(n=>n(m)))`;
PRED=`(n=>(f=>(x=>n((g=>(h=>h(g(f)))))((y=>x))((y=>y)))))`;
SUBTRACT=`(m=>(n=>n(${PRED})(m)))`;



TRUE=`(x=>(y=>x))`;
FALSE=`(x=>(y=>y))`;
IF=`(b=>b)`;

NOT=`(b=>(x=>(y=>b(y)(x))))`;
AND=`(a=>(b=>a(b)(a)))`;
OR=`(a=>(b=>a(a)(b)))`;



IS_ZERO=`(n=>n((x=>${FALSE}))(${TRUE}))`;
IS_LESS_OR_EQUAL=`(m=>(n=>${IS_ZERO}(${SUBTRACT}(m)(n))))`;
IS_EQUAL=`(m=>(n=>${AND}(${IS_LESS_OR_EQUAL}(m)(n))(${IS_LESS_OR_EQUAL}(n)(m))))`;



Y=`(f=>(x=>f(x(x)))((x=>f(x(x)))))`;
Z=`(f=>(x=>f((v=>x(x)(v))))((x=>f((v=>x(x)(v))))))`;



FACTORIAL=`${Z}((f=>(n=>${IF}(${IS_ZERO}(n))(${ONE})((v=>${MULTIPLY}(n)(f(${PRED}(n)))(v))))))`;
DIV=`${Z}((f=>(m=>(n=>${IF}(${IS_LESS_OR_EQUAL}(n)(m))((v=>${SUCC}(f(${SUBTRACT}(m)(n))(n))(v)))(${ZERO})))))`;
MOD=`${Z}((f=>(m=>(n=>${IF}(${IS_LESS_OR_EQUAL}(n)(m))((v=>f(${SUBTRACT}(m)(n))(n)(v)))(m)))))`;



PAIR=`(x=>(y=>(f=>f(x)(y))))`;
FIRST=`(p=>p((x=>(y=>x))))`;
SECOND=`(p=>p((x=>(y=>y))))`;



NIL=`(f=>(x=>x))`;
CONS=`(x=>(l=>(f=>(y=>f(x)(l(f)(y))))))`;
IS_NIL=`(k=>k((x=>(l=>${FALSE})))(${TRUE}))`;
HEAD=`(k=>k((x=>(l=>x)))(${NIL}))`;
TAIL=`(l=>${FIRST}(l((x=>(p=>${PAIR}(${SECOND}(p))(${CONS}(x)(${SECOND}(p))))))(${PAIR}(${NIL})(${NIL}))))`;

FOLD_LEFT=`${Z}((f=>(g=>(x=>(l=>${IF}(${IS_NIL}(l))(x)((v=>f(g)(g(${HEAD}(l))(x))(${TAIL}(l))(v))))))))`;
FOLD_RIGHT=`(f=>(x=>(l=>l(f)(x))))`;
MAP=`(f=>${FOLD_RIGHT}((x=>${CONS}(f(x))))(${NIL}))`;

RANGE=`${Z}((f=>(m=>(n=>${IF}(${IS_LESS_OR_EQUAL}(m)(n))((v=>${CONS}(m)(f(${SUCC}(m))(n))(v)))(${NIL})))))`;
SUM=`${FOLD_LEFT}(${ADD})(${ZERO})`;
PRODUCT=`${FOLD_LEFT}(${MULTIPLY})(${ONE})`;
APPEND=`(k=>(l=>${FOLD_RIGHT}(${CONS})(l)(k)))`;
PUSH=`(x=>(l=>${APPEND}(l)(${CONS}(x)(${NIL}))))`;
REVERSE=`${FOLD_RIGHT}(${PUSH})(${NIL})`;

INCREMENT_ALL=`${MAP}(${SUCC})`;
DOUBLE_ALL=`${MAP}(${MULTIPLY}(${TWO}))`;



TEN=`${SUCC}(${MULTIPLY}(${THREE})(${THREE}))`;
RADIX=`${TEN}`;
TO_DIGITS=`${Z}((f=>(n=>${PUSH}(${MOD}(n)(${RADIX}))(${IF}(${IS_LESS_OR_EQUAL}(n)(${PRED}(${RADIX})))(${NIL})((v=>f(${DIV}(n)(${RADIX}))(v)))))))`;
TO_CHAR=`(n=>n)`;
TO_STRING=`(n=>${MAP}(${TO_CHAR})(${TO_DIGITS}(n)))`;



FOUR=`${SUCC}(${THREE})`;
FIVE=`${SUCC}(${FOUR})`;
FIFTEEN=`${MULTIPLY}(${THREE})(${FIVE})`;
HUNDRED=`${MULTIPLY}(${TEN})(${TEN})`;
FIZZ=`${MAP}(${ADD}(${RADIX}))(${CONS}(${ONE})(${CONS}(${TWO})(${CONS}(${FOUR})(${CONS}(${FOUR})(${NIL})))))`;
BUZZ=`${MAP}(${ADD}(${RADIX}))(${CONS}(${ZERO})(${CONS}(${THREE})(${CONS}(${FOUR})(${CONS}(${FOUR})(${NIL})))))`;

FIZZBUZZ=`m=>${MAP}(n=>${IF}(${IS_ZERO}(${MOD}(n)(${FIFTEEN})))(${APPEND}(${FIZZ})(${BUZZ}))(${IF}(${IS_ZERO}(${MOD}(n)(${THREE})))(${FIZZ})(${IF}(${IS_ZERO}(${MOD}(n)(${FIVE})))(${BUZZ})(${TO_STRING}(n)))))(${RANGE}(${ONE})(m))`;

_TO_INTEGER=`(f=>f(n=>++n)(+[]))`;
_TO_BOOLEAN=`(f=>f(!![])(![]))`;
_TO_BOOLEAN2=`(f=>${IF}(f)(!![])(![]))`;
_TO_ARRAY=`(${Z}(f=>(a=>${_TO_BOOLEAN}(${IS_NIL}(a))?[]:[${HEAD}(a),...f(${TAIL}(a))])))`;
_TO_CHAR=`(c=>'0123456789BFiuz'[${_TO_INTEGER}(c)])`;
_TO_STRING=`(s=>${_TO_ARRAY}(s).map(${_TO_CHAR}).join(""))`;


console.log(`0\n${ZERO}\n(${_TO_INTEGER})(${ZERO})`);
console.log(`1\n${ONE}\n(${_TO_INTEGER})(${ONE})`);
console.log(`5\n${FIVE}\n(${_TO_INTEGER})(${FIVE})`);
console.log(`10\n${TEN}\n(${_TO_INTEGER})(${TEN})`);
console.log(`[1..10]\n${_TO_ARRAY}(${RANGE}(${ONE})(${TEN})).map(${_TO_INTEGER})`)
console.log(`[1..100]\n${_TO_ARRAY}(${RANGE}(${ONE})(${HUNDRED})).map(${_TO_INTEGER})`)
console.log(`fizzbuzz(100)\n${_TO_ARRAY}(${FIZZBUZZ}(${HUNDRED})).map(${_TO_STRING})`)

