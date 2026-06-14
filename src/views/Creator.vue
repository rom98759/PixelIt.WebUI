<template>
    <v-container class="gallery">
        <v-row>
            <v-col cols="12" lg="12">
                <v-bottom-navigation :value="pixelMode" color="primary">
                    <v-btn @click="changePixelModeTo8x8()">
                        <span>8x8 Pixel</span>
                        <v-icon>mdi-grid</v-icon>
                    </v-btn>

                    <v-btn @click="changePixelModeTo8x32()">
                        <span>8x32 Pixel</span>
                        <v-icon>mdi-grid</v-icon>
                    </v-btn>
                </v-bottom-navigation>
            </v-col>
        </v-row>
        <v-row v-if="pixelMode === PIXEL_MODE_8x8">
            <v-col cols="12" lg="4" offset-lg="2">
                <v-card class="pa-3" elevation="4">
                    <Art :colors="colors" pixelCount="64" :func="onclick" :backgrounds="current8x8Background" />
                    <v-card-text class="px-0 pb-2">
                        <div class="d-flex flex-wrap phase-list">
                            <v-chip
                                v-for="(phase, index) in animationFrames"
                                :key="index"
                                class="ma-1"
                                :color="selectedAnimationFrame === index ? 'primary' : ''"
                                :outlined="selectedAnimationFrame !== index"
                                @click="selectAnimationFrame(index)"
                            >
                                {{ phaseLabel(index) }}
                            </v-chip>
                            <v-chip class="ma-1" outlined color="green" :disabled="!canAddAnimationFrame" @click="addAnimationFrame()"> + Add phase </v-chip>
                        </div>
                        <div class="text-caption mt-1 orange--text text--darken-2">
                            Maximum 9 phases
                        </div>
                    </v-card-text>
                    <v-textarea filled outlined v-model="currentAnimationFrameString" rows="5" hide-details label="Current phase"></v-textarea>
                    <v-row class="my-2" dense>
                        <v-col cols="4">
                            <v-btn block small outlined color="primary" @click="duplicateAnimationFrame" :disabled="animationFrames.length === 0 || !canAddAnimationFrame">Duplicate</v-btn>
                        </v-col>
                        <v-col cols="4">
                            <v-btn block small outlined color="error" @click="removeAnimationFrame" :disabled="animationFrames.length <= 1">Delete</v-btn>
                        </v-col>
                        <v-col cols="4">
                            <v-btn block small outlined color="blank" @click="addAnimationFrame(false)" :disabled="!canAddAnimationFrame">Blank</v-btn>
                        </v-col>
                    </v-row>
                    <v-textarea filled outlined v-model="animationString" rows="5" hide-details label="Animation output"></v-textarea>
                    <v-switch v-model="livedraw" label="Live draw" hide-details dense></v-switch>
                    <div class="text-center">
                        <ButtonSave color="green" text="Save" icon="mdi-content-save" :data="animationString" :pixelMode="this.pixelMode" :condition="true"></ButtonSave>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" lg="4">
                <v-card class="pa-3" elevation="4">
                    <v-color-picker v-model="colors" mode="hexa" dot-size="20" show-swatches swatches-max-height="280"></v-color-picker>
                </v-card>
            </v-col>
        </v-row>
        <v-row v-if="pixelMode === PIXEL_MODE_8x32">
            <v-col cols="12" lg="8" offset-lg="0">
                <v-card class="pa-3" elevation="4">
                    <Art :colors="colors" pixelCount="256" :func="onclick" :backgrounds="active8x32Background" />
                    <p></p>
                    <v-textarea filled outlined v-model="array8x32String" rows="9" hide-details></v-textarea>
                    <v-switch v-model="livedraw" label="Live draw" :disabled="!socketIsConnected" hide-details dense></v-switch>
                    <div class="text-center" v-if="isAnimated">
                        <v-card-text><h3 class="red--text">No animated 8x32 bitmaps are supported!</h3></v-card-text>
                    </div>
                    <div class="text-center">
                        <ButtonSave color="green" text="Save" icon="mdi-content-save" :data="array8x32String" :pixelMode="pixelMode" :condition="!isAnimated"></ButtonSave>
                    </div>
                </v-card>
            </v-col>
            <v-col cols="12" lg="4">
                <v-card class="pa-3" elevation="4">
                    <v-color-picker v-model="colors" mode="hexa" dot-size="20" show-swatches swatches-max-height="270"></v-color-picker>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>
<script>
import Art from '../components/Art';
import ButtonSave from '../components/ButtonBMPSave';
export default {
    data() {
        return {
            colors: '#F44336',
            PIXEL_MODE_8x8,
            PIXEL_MODE_8x32,
            pixelMode: PIXEL_MODE_8x8,
            animationFrames: [createBlankFrame(FRAME_SIZE_8x8)],
            selectedAnimationFrame: 0,
            active8x32Background: createBlankFrame(FRAME_SIZE_8x32),
            array8x32String: createBlankBitmapString(FRAME_SIZE_8x32),
            livedraw: false,
        };
    },
    components: {
        Art,
        ButtonSave,
    },
    computed: {
        current8x8Background() {
            return this.animationFrames[this.selectedAnimationFrame] || createBlankFrame(FRAME_SIZE_8x8);
        },
        currentAnimationFrameString: {
            get() {
                return bitmapArrayToString(this.current8x8Background);
            },
            set(value) {
                this.$set(this.animationFrames, this.selectedAnimationFrame, parseBitmapString(value, FRAME_SIZE_8x8));
            },
        },
        animationString: {
            get() {
                return serializeAnimationFrames(this.animationFrames.slice(0, MAX_ANIMATION_FRAMES));
            },
            set(value) {
                const parsedFrames = parseAnimationString(value, FRAME_SIZE_8x8).slice(0, MAX_ANIMATION_FRAMES);
                this.animationFrames = parsedFrames.length > 0 ? parsedFrames : [createBlankFrame(FRAME_SIZE_8x8)];
                this.selectedAnimationFrame = Math.min(this.selectedAnimationFrame, this.animationFrames.length - 1);
            },
        },
        cleaned8x32String() {
            return cleanBitmapInput(this.array8x32String);
        },
        isAnimated() {
            return this.cleaned8x32String.includes('],[');
        },
        socketIsConnected() {
            return this.$store.state.socket.isConnected;
        },
        canAddAnimationFrame() {
            return this.animationFrames.length < MAX_ANIMATION_FRAMES;
        },
    },
    watch: {
        array8x32String(value) {
            this.active8x32Background = parseBitmapString(value, FRAME_SIZE_8x32);
        },
    },
    methods: {
        onclick(id, color) {
            const pixelIndex = id - 1;

            if (this.pixelMode === PIXEL_MODE_8x8) {
                this.$set(this.current8x8Background, pixelIndex, color);
            } else {
                this.$set(this.active8x32Background, pixelIndex, color);
                this.array8x32String = bitmapArrayToString(this.active8x32Background);
            }

            if (this.livedraw) {
                this.$socket.sendObj({
                    setScreen: buildLiveDrawScreen(this),
                });
            }
        },
        phaseLabel(index) {
            return `Phase ${index + 1}`;
        },
        changePixelModeTo8x8() {
            this.setPixelMode(PIXEL_MODE_8x8);
        },
        changePixelModeTo8x32() {
            this.setPixelMode(PIXEL_MODE_8x32);
        },
        setPixelMode(mode) {
            this.pixelMode = mode;
        },
        selectAnimationFrame(index) {
            this.selectedAnimationFrame = index;
        },
        addAnimationFrame(copyCurrent = true) {
            if (!this.canAddAnimationFrame) {
                return;
            }

            const frame = copyCurrent
                ? cloneFrame(this.current8x8Background, FRAME_SIZE_8x8)
                : createBlankFrame(FRAME_SIZE_8x8);

            this.animationFrames.splice(this.selectedAnimationFrame + 1, 0, frame);
            this.selectedAnimationFrame += 1;
        },
        duplicateAnimationFrame() {
            this.addAnimationFrame(true);
        },
        removeAnimationFrame() {
            if (this.animationFrames.length <= 1) {
                return;
            }

            this.animationFrames.splice(this.selectedAnimationFrame, 1);
            this.selectedAnimationFrame = Math.max(0, Math.min(this.selectedAnimationFrame, this.animationFrames.length - 1));
        },
    },
};

function buildLiveDrawScreen(context) {
    if (context.pixelMode === PIXEL_MODE_8x8) {
        return {
            bitmapAnimation: {
                data: parseAnimationString(context.animationString, FRAME_SIZE_8x8),
                animationDelay: 200,
            },
        };
    }

    return {
        bitmap: {
            data: JSON.parse(context.array8x32String),
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

const MAX_ANIMATION_FRAMES = 9;

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

const PIXEL_MODE_8x8 = 0;
const PIXEL_MODE_8x32 = 1;
const FRAME_SIZE_8x8 = 64;
const FRAME_SIZE_8x32 = 256;
</script>
<style scoped>
#art,
.v-color-picker {
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
}
</style>
