/* eslint http://eslint.org/docs/rules/
 * 代码格式相关的很多都可以通过 eslint --fix 来自动修正
 * error 表示这么写或者让代码难以理解，或者阅读不方便
 * warn 表示对代码影响不大的限制
 */

module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": {
    //unix 换行符
    "linebreak-style": ["error", "unix"],
    //单引号
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-console": "off",

    // 禁止对undefined， Infinity，NaN等重定义
    "no-shadow-restricted-names": "error",

    // while, if, else 都要换行
    "curly": ["error", "all"],
    "default-case": "warn",

    /*
     * var foo = object
     *    .property
     */
    "dot-location": ["error", "property"],
    "eqeqeq": ["error", "smart"],

    // .5 这种数字
    "no-floating-decimal": "warn",

    // 不必要的{}
    "no-lone-blocks": "error",

    // 多余空格
    "no-multi-spaces": "warn",

    // 字符串换行写用 + ，不用\
    "no-multi-str": "warn",
    "no-new-func": "error",

    // 不要 new String, Number, Boolean
    "no-new-wrappers": "error",
    "no-self-compare": "error",
    "no-unused-expressions": "error",

    // 不定义未使用变量，参数最后一个必须使用
    "no-unused-vars": ["warn", {
      "args": "after-used"
    }],

    // 限制var作用域
    "block-scoped-var": "error",

    // callback 之后return
    "callback-return": "error",
    "handle-callback-err": "error",
    "no-new-require": "error",

    //style
    "brace-style": "error",
    "camelcase": ["error", {properties: "never"}],
    // 多余,
    "comma-dangle": "warn",
    "comma-spacing": ["warn", {
      "before": false,
      "after": true
    }],
    // 句末逗号
    "comma-style": ["warn", "last"],
    "computed-property-spacing": ["warn", "never"],
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "key-spacing": ["warn", {
      "beforeColon": false
    }],
    "keyword-spacing": ["warn", {
      "before": true
    }],
    "lines-around-comment": ["warn", {
      "beforeBlockComment": true
    }],
    //代码宽度
    "max-len": ["error", 100, {
      "ignoreTrailingComments": true,
      "ignoreUrls": true
    }],
    "max-statements-per-line": ["error", {
      "max": 1
    }],
    "new-cap": ["error",{ "properties": false }],

    // new 需要括号 new Class();
    "new-parens": "error",
    "newline-after-var": "warn",
    "newline-per-chained-call": ["warn", {
      "ignoreChainWithDepth": 2
    }],
    "no-array-constructor": "error",

    // 最多空行，默认2
    "no-multiple-empty-lines": "warn",
    "no-new-object": "error",
    "no-spaced-func": "error",

    // 禁止 obj .property 形式
    "no-whitespace-before-property": "warn",

    // object 最多一行写两个属性
    "object-curly-newline": ["warn", {
      "minProperties": 3
    }],
    "one-var": ["error", "never"],

    // 表达式换行时符号写句首，=除外
    "operator-linebreak": ["warn", "before", {
      "overrides": {
        "=": "after"
      }
    }],

    // 一个object里 key有没有引号要统一
    "quote-props": ["error", "consistent"],
    "space-before-blocks": "warn",
    "space-before-function-paren": "warn",
    "space-infix-ops": "warn",
    "space-unary-ops": "warn",
    "spaced-comment": ["warn", "always"],


    //最大代码层级深度
    "max-depth": ["error", 3],
    //最大嵌套深度
    "max-nested-callbacks": ["error", 3]
  },

  "globals": {
    "module": true,
    "require": true,
    "global": true,
    "process": true,
    "__filename":true,
    "__dirname": true,
    "actor": true
  },
};
