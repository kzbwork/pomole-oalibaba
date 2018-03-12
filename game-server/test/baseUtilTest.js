/**
 *
 * author:
 * date:
 */

'use strict';

let baseUtil = require('../app/libs/slot/baseUtil');
let consts = require('../app/consts/consts');
let assert = require('assert');

describe('baseUtil', function () {
  it(`getValidElements`, function () {
    let config = {
      element: {
        "1": [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10
        ],
        "2": [
          21
        ],
        "4": [
          22
        ]
      }
    };

    assert.deepEqual(baseUtil.getValidElements(config, [consts.ELEMENT_TYPE.NORMAL]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(baseUtil.getValidElements(config, [consts.ELEMENT_TYPE.WILD]), [21]);
    assert.deepEqual(baseUtil.getValidElements(config, [consts.ELEMENT_TYPE.FREESPIN]), [22]);
    assert.deepEqual(baseUtil.getValidElements(config, [consts.ELEMENT_TYPE.NORMAL, consts.ELEMENT_TYPE.FREESPIN])
      , [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 22]);
  });

  it(`fillMatrix`, function () {
    let matrix = [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1]
    ];

    let config = {
      element: {
        "1": [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10
        ],
        "2": [
          21
        ],
        "4": [
          22
        ]
      }
    };

    let filledMatrix = baseUtil.fillMatrix(matrix, [consts.ELEMENT_TYPE.NORMAL, consts.ELEMENT_TYPE.WILD, consts.ELEMENT_TYPE.FREESPIN], config);
    for (let x = 0; x < matrix.length; ++x) {
      let list = matrix[x];
      for (let y = 0; y < list.length; ++y) {
        assert.notEqual(list[y], -1);
      }
    }

    assert.deepEqual(filledMatrix, matrix);
  });

  it(`cloneMatrix`, function () {
    let matrix = [
      [2, 6, 3],
      [1, 5, 4],
      [6, 3, 1],
      [4, 2, 5],
      [3, 2, 2]
    ];
    let clonedMatrix = baseUtil.cloneMatrix(matrix);
    assert.deepEqual(matrix, clonedMatrix);
  });

  it(`concatMatrix`, function () {
    let originMatrix = [
      [1, 2],
      [2, 3],
      [1],
      [],
      [1, 3, 5]
    ];
    let concatMatrix = [
      [3],
      [4, 5],
      [2, 3, 6],
      [6, 4, 3],
      [2, 3]
    ];
    let concatedMatrix = [
      [1, 2, 3],
      [2, 3, 4, 5],
      [1, 2, 3, 6],
      [6, 4, 3],
      [1, 3, 5, 2, 3]
    ];
    baseUtil.concatMatrix(originMatrix, concatMatrix);
    assert.deepEqual(originMatrix, concatedMatrix);
  });

  it(`getRewardElement`, function () {
    assert.equal(baseUtil.getRewardElement(1, 2), -1);
    assert.equal(baseUtil.getRewardElement(1, 1), 1);
    assert.equal(baseUtil.getRewardElement(2, 1), -1);
    assert.equal(baseUtil.getRewardElement(1, consts.SPECIAL_ELEMENT.WILD), 1);
    assert.equal(baseUtil.getRewardElement(consts.SPECIAL_ELEMENT.WILD, 1), 1);
    assert.equal(baseUtil.getRewardElement(consts.SPECIAL_ELEMENT.WILD, consts.SPECIAL_ELEMENT.WILD), consts.SPECIAL_ELEMENT.WILD);
  });
});

