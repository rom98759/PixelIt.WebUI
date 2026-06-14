<template>
    <canvas :height="height ? height : 150" :width="width ? width : bmp.sizeX == 8 ? 150 : 230" v-insertbmp="bmp"></canvas>
</template>

<script>
export default {
    props: {
        bmp: {
            type: Object,
            required: true,
        },
        animate: {
            type: Boolean,
            default: false,
        },
        height: {
            type: String,
            required: false,
        },
        width: {
            type: String,
            required: false,
        },
    },
    directives: {
        insertbmp: {
            inserted(canvasElement, binding, vnode) {
                let bmpArrayString = binding.value.rgB565Array;
                const sizeX = binding.value.sizeX;
                const sizeY = binding.value.sizeY;
                const shouldAnimate = vnode.context && vnode.context.animate;

                if (bmpArrayString.endsWith(',')) {
                    bmpArrayString = bmpArrayString.slice(0, -1);
                }

                const bmpArray = JSON.parse(`[${bmpArrayString}]`);

                function drawCanvas(bmp) {
                    const ctx = canvasElement.getContext('2d');
                    const canvasWidth = canvasElement.width;
                    const canvasHeight = canvasElement.height;
                    const size = canvasWidth / sizeX;

                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                    const width = sizeX;
                    const height = sizeX == 8 ? sizeY : sizeY + 6;
                    let i = 0;
                    for (let y = sizeX == 8 ? 0 : 6; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const rgb = RGB565IntToRGB(bmp[i++]);
                            const color = RGBToHEX(rgb[0], rgb[1], rgb[2]);
                            ctx.fillStyle = color;
                            ctx.fillRect(x * size, y * size, size, size);
                        }
                    }
                }

                if (shouldAnimate && bmpArray.length > 1) {
                    let frameIndex = 0;
                    drawCanvas(bmpArray[frameIndex]);
                    canvasElement.__bmpLoopInterval = setInterval(() => {
                        frameIndex = (frameIndex + 1) % bmpArray.length;
                        drawCanvas(bmpArray[frameIndex]);
                    }, 250);
                } else {
                    drawCanvas(bmpArray[0]);
                }
            },
            unbind(canvasElement) {
                if (canvasElement.__bmpLoopInterval) {
                    clearInterval(canvasElement.__bmpLoopInterval);
                    canvasElement.__bmpLoopInterval = null;
                }
            },
        },
    },
};

function RGB565IntToRGB(color) {
    const r = (((color >> 11) & 0x1f) * 527 + 23) >> 6;
    const g = (((color >> 5) & 0x3f) * 259 + 33) >> 6;
    const b = ((color & 0x1f) * 527 + 23) >> 6;
    return [r, g, b];
}

function RGBToHEX(red, green, blue) {
    const rgb = blue | (green << 8) | (red << 16);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
}
</script>
