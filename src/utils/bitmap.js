const MAX_ANIMATION_FRAMES = 9;
const PIXEL_MODE_8x8 = 0;
const PIXEL_MODE_8x32 = 1;
const FRAME_SIZE_8x8 = 64;
const FRAME_SIZE_8x32 = 256;

function buildLiveDrawScreen({ pixelMode, animationString, array8x32String }) {
    if (pixelMode === PIXEL_MODE_8x8) {
        return {
            bitmapAnimation: {
                data: parseAnimationString(animationString, FRAME_SIZE_8x8),
                animationDelay: 200,
            },
        };
    }

    return {
        bitmap: {
            data: JSON.parse(array8x32String),
            position: {
                x: 0,
                y: 0,
            },
            size: {
                width: 32,
                height: 8,
            },
        },
    };
}

function parseBitmapString(value, size) {
    const matches = cleanBitmapInput(value).match(/\d+/g);
    const parsedValues = matches ? matches.slice(0, size).map((number) => rgb565ToHex(Number(number))) : [];

    return Array.from({ length: size }, (_, index) => parsedValues[index] || '#000000');
}

function bitmapArrayToString(backgrounds) {
    const values = backgrounds.map((hex) => rgb888ToRgb565(hexToRgb(hex)));

    return `[${values.join(',')}]`;
}

function serializeAnimationFrames(frames) {
    return frames.map((frame) => bitmapArrayToString(frame)).join(',');
}

function parseAnimationString(value, size) {
    const normalized = trimOuterBrackets(cleanBitmapInput(value));

    if (normalized === '') {
        return [createBlankFrame(size)];
    }

    return normalized
        .split('],[')
        .map((frame) => parseBitmapString(frame, size))
        .slice(0, MAX_ANIMATION_FRAMES);
}

function cleanBitmapInput(value) {
    return `${value || ''}`.replace(/\s+/g, '');
}

function trimOuterBrackets(value) {
    return value.replace(/^\[/, '').replace(/\]$/, '');
}

function createBlankFrame(size) {
    return Array.from({ length: size }, () => '#000000');
}

function createBlankBitmapString(size) {
    return `[${Array.from({ length: size }, () => 0).join(',')}]`;
}

function cloneFrame(frame, size) {
    return Array.from({ length: size }, (_, index) => frame[index] || '#000000');
}

function rgb888ToRgb565(rgbArray) {
    return ((rgbArray.r & 0xf8) << 8) + ((rgbArray.g & 0xfc) << 3) + (rgbArray.b >> 3);
}

function rgb565ToHex(rgb565) {
    const red = ((rgb565 >> 11) & 0x1f) << 3;
    const green = ((rgb565 >> 5) & 0x3f) << 2;
    const blue = (rgb565 & 0x1f) << 3;

    return `#${[red, green, blue]
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')}`;
}

function hexToRgb(hex) {
    const normalizedHex = `${hex || ''}`.replace('#', '');
    const shorthandRegex = /^([a-f\d])([a-f\d])([a-f\d])$/i;
    const expandedHex = normalizedHex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expandedHex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
}

module.exports = {
    MAX_ANIMATION_FRAMES,
    PIXEL_MODE_8x8,
    PIXEL_MODE_8x32,
    FRAME_SIZE_8x8,
    FRAME_SIZE_8x32,
    buildLiveDrawScreen,
    bitmapArrayToString,
    cloneFrame,
    cleanBitmapInput,
    createBlankBitmapString,
    createBlankFrame,
    hexToRgb,
    parseAnimationString,
    parseBitmapString,
    rgb565ToHex,
    rgb888ToRgb565,
    serializeAnimationFrames,
    trimOuterBrackets,
};