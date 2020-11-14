const Bignumber = require('bignumber.js');
const randomstring = require('randomstring');

module.exports = {
  unitConversion(number, decimal = 18) {
    number = Number.parseInt(number);
    decimal = Math.pow(10, decimal);
    const price = number / decimal;
    return price;
  },
  /**
   * @description 大数相加
   * @param {string|number} numberA
   * @param {string|number} numberB
   * @returns {number} res
   */
  bigAdd(numberA, numberB) {
    const a = new Bignumber(numberA);
    const b = new Bignumber(numberB);
    const res = a.plus(b).toNumber();
    return res;
  },

  /**
   * @description 大数相减
   * @param {string|number} numberA
   * @param {string|number} numberB
   * @returns {number} res
   */
  bigMinus(numberA, numberB) {
    const a = new Bignumber(numberA);
    const b = new Bignumber(numberB);
    const res = a.minus(b).toNumber();
    return res;
  },

  /**
   * @description 大数相乘
   * @param {string|number} numberA
   * @param {string|number} numberB
   * @returns {number} res
   */
  bigMult(numberA, numberB) {
    const a = new Bignumber(numberA);
    const b = new Bignumber(numberB);
    const res = a.multipliedBy(b).toNumber();
    return res;
  },

  /**
   * @description 大数相除
   * @param {string|number} numberA
   * @param {string|number} numberB
   * @returns {number} res
   */
  bigDiv(numberA, numberB) {
    numberB = Number.parseFloat(numberB);

    if (numberB === 0) return 0;

    const a = new Bignumber(numberA);
    const b = new Bignumber(numberB);
    const res = a.dividedBy(b).toNumber();
    return res;
  },
  getRandom(length = 15, charset = 'alphabetic') {
    const randomString = randomstring.generate({
      length,
      charset,
    });
    return randomString;
  },

  sleep(time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      });
    }, time * 1000);
  },
};
