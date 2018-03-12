/**
 *
 * author:
 * date:
 */

'use strict';

let alibabaUtil = require('../app/libs/slot/alibabaUtil');
let assert = require('assert');

describe('alibabaUtil', function () {
  it(`fillMatrixForElinimateFree`, function () {
    let config = {
      rewardFreeSpin: {
        reel1: [1, 1, 1, 1, 1],
        reel2: [1, 1, 1, 1, 2],
        reel3: [1, 1, 1, 1, 3],
        reel4: [3, 3, 3, 3, 3],
        reel5: [3, 3, 3, 3, 3],
      },
      line: [
        [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 0}]
      ],
      reward: {
        "1": {
          "elem": 1,
          "num": 3,
          "mult": 27
        }
      }
    };

    let matrix = [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1]
    ];
    let result = alibabaUtil.fillMatrixForElinimateFree(matrix, config);
    console.log(`result = ${JSON.stringify(result)}`);
  });
});

