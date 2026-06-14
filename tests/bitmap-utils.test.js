const assert = require('assert');
const bitmap = require('../src/utils/bitmap');

function test(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    } catch (error) {
        console.error(`not ok - ${name}`);
        throw error;
    }
}

test('parses a bitmap string into the expected frame size', () => {
    const frame = bitmap.parseBitmapString('[0,65535]', 4);

    assert.strictEqual(frame.length, 4);
    assert.strictEqual(frame[0], '#000000');
    assert.strictEqual(frame[1], '#f8fcf8');
    assert.strictEqual(frame[2], '#000000');
    assert.strictEqual(frame[3], '#000000');
});

test('serializes a frame back to a bitmap string', () => {
    const serialized = bitmap.bitmapArrayToString(['#000000', '#ffffff']);

    assert.strictEqual(serialized, '[0,65535]');
});

test('parses and serializes animation frames', () => {
    const animation = bitmap.parseAnimationString('[[0,65535],[65535,0]]', 2);

    assert.strictEqual(animation.length, 2);
    assert.strictEqual(bitmap.serializeAnimationFrames(animation), '[0,65535],[65535,0]');
});

test('builds a live draw payload for 8x32 bitmaps', () => {
    const payload = bitmap.buildLiveDrawScreen({
        pixelMode: bitmap.PIXEL_MODE_8x32,
        animationString: '',
        array8x32String: '[0,65535]',
    });

    assert.deepStrictEqual(payload, {
        bitmap: {
            data: [0, 65535],
            position: { x: 0, y: 0 },
            size: { width: 32, height: 8 },
        },
    });
});