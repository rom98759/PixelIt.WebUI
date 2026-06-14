<template>
    <v-container class="gallery">
        <v-row dense>
            <v-col cols="12">
                <v-text-field v-model="message" v-if="!isBusy" prepend-inner-icon="mdi-magnify" single-line outlined filled dense hide-details label="Search for name or ID" type="text"></v-text-field>
            </v-col>
            <v-col v-if="isBusy && !hasCachedItems" cols="12" class="text-center py-12">
                <v-progress-circular indeterminate size="36" width="3" color="primary"></v-progress-circular>
                <div class="mt-3">Loading...</div>
            </v-col>
            <v-col v-else-if="filteredBMPs.length === 0" cols="12" class="text-center py-12">
                <v-alert outlined type="info" border="left" class="mb-0">No bitmap matches your search.</v-alert>
            </v-col>
            <v-col v-for="bmp in pagedBMPs" :key="bmp.id" cols="12" sm="6" md="4" lg="3" xl="2">
                <v-card class="pa-2" elevation="4">
                    <div class="text-center">
                        {{ bmp.name }}
                    </div>
                    <hr />
                    <p></p>
                    <BmpCanvas :bmp="bmp" :animate="false" />
                    <p></p>
                    <!-- <hr /> -->
                    <div class="text-center">
                        <BmpDialog :bmp="bmp" />
                        <v-btn icon @click="sendBitmap(bmp.rgB565Array, bmp.sizeX)" :disabled="!sockedIsConnected" class="float-right" title="Show on PixelIt">
                            <v-icon>mdi-arrow-right-circle-outline</v-icon>
                        </v-btn>
                    </div>
                    <div class="text-center">
                        <v-text-field prepend-inner-icon="mdi-identifier" rounded dense hide-details readonly :value="bmp.id" append-outer-icon="mdi-content-copy" @click:append-outer="copyText(bmp.id, $event)"></v-text-field>
                    </div>
                </v-card>
            </v-col>
            <v-col v-if="pageCount > 1" cols="12" class="pt-6">
                <div class="text-center">
                    <v-pagination v-model="page" :length="pageCount" :total-visible="isCompact ? 5 : 7"></v-pagination>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import BmpCanvas from '../components/BmpCanvas';
import BmpDialog from '../components/BmpDialog';

export default {
    name: 'Gallery',
    components: {
        BmpCanvas,
        BmpDialog,
    },
    data() {
        return {
            message: '',
            loading: true,
            page: 1,
            pageSize: 24,
        };
    },
    created() {
        getBMPsFromAPI(this.$store.state)
            .finally(() => {
                this.loading = false;
            });
    },
    computed: {
        hasCachedItems() {
            return this.$store.state.bmpsFromAPI.length > 0;
        },
        isBusy() {
            return this.loading && !this.hasCachedItems;
        },
        filteredBMPs() {
            const search = this.message.toLowerCase().trim();
            const exactId = this.message.trim();

            return this.$store.state.bmpsFromAPI.filter((bmp) => bmp.name.toLowerCase().includes(search) || String(bmp.id) === exactId);
        },
        pageCount() {
            return Math.max(1, Math.ceil(this.filteredBMPs.length / this.pageSize));
        },
        pagedBMPs() {
            const startIndex = (this.page - 1) * this.pageSize;
            return this.filteredBMPs.slice(startIndex, startIndex + this.pageSize);
        },
        sockedIsConnected() {
            return this.$store.state.socket.isConnected;
        },
        isCompact() {
            return this.$vuetify.breakpoint.smAndDown;
        },
    },
    watch: {
        message() {
            this.page = 1;
        },
    },
    methods: {
        copyText(value, event) {
            navigator.clipboard.writeText(value);
            setTimeout(() => {
                event.target.blur();
            }, 200);
        },
        sendBitmap(rgB565Array, sizeX) {
            if (rgB565Array.endsWith(',')) {
                rgB565Array = rgB565Array.slice(0, -1);
            }
            if (sizeX == 8) {
                this.$socket.sendObj({
                    setScreen: {
                        bitmapAnimation: {
                            data: JSON.parse(`[${rgB565Array}]`),
                            animationDelay: 200,
                        },
                    },
                });
            } else {
                this.$socket.sendObj({
                    setScreen: {
                        bitmap: {
                            data: JSON.parse(rgB565Array),
                            position: {
                                x: 0,
                                y: 0,
                            },
                            size: {
                                width: sizeX,
                                height: 8,
                            },
                        },
                    },
                });
            }
        },
    },
};

async function getBMPsFromAPI(state) {
    try {
        state.bmpsFromAPI = await (await fetch('https://pixelit.bastelbunker.de/api/GetBMPAll')).json();
    } catch (error) {
        console.log(`getBMPsFromAPI: error (${error})`);
        state.bmpsFromAPI = [];
    }
}
</script>

<style scoped>
canvas {
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
    border: 1px solid;
    border-color: grey;
}
</style>
