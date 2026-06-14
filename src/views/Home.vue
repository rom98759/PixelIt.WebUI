<template>
    <v-container class="home">
        <v-row>
            <v-col cols="12" md="6" lg="3">
                <v-card class="pa-2" elevation="4">
                    <v-card-title>
                        <h2>System</h2>
                    </v-card-title>
                    <hr />
                    <br />
                    <div class="text-center updateMessage" v-if="newVersionAvailable && !isDemoMode">
                        <a class="updateMessage" :href="gitUpdateURL" target="_blank">Update to version {{ gitVersion }} available!</a>
                        <v-icon size="16px" class="updateMessage">mdi-open-in-new</v-icon>
                    </div>
                    <ListInfo :items="systemItems" />
                </v-card>
            </v-col>
            <v-col cols="12" md="6" lg="3">
                <v-card class="pa-2" elevation="4">
                    <v-card-title>
                        <h2>Liveview</h2>
                    </v-card-title>
                    <hr />
                    <br />
                    <Liveview class="text-center" :data="liveview" :options="liveviewCanvasSettings" />
                </v-card>
                <br />
                <v-card class="pa-2" elevation="4">
                    <v-card-title>
                        <h2>Sensors</h2>
                    </v-card-title>
                    <hr />
                    <br />
                    <ListInfo :items="sensorItems" />
                </v-card>
                <br />
                <v-card class="pa-2" elevation="4">
                    <v-card-title>
                        <h2>Buttons</h2>
                    </v-card-title>
                    <hr />
                    <br />
                    <ListInfo :items="buttonItems" />
                </v-card>
            </v-col>
            <v-col cols="12" lg="6">
                <v-card class="pa-2" elevation="4">
                    <v-card-title>
                        <h2>Logs</h2>
                    </v-card-title>
                    <hr />
                    <br />
                    <Log :log="log" />
                </v-card>
                <br />
                <v-card class="pa-2" elevation="4">
                    <v-card-title>
                        <h2>Usermap</h2>
                    </v-card-title>
                    <hr />
                    <v-card-text class="text-md-center" v-if="userMapError || sendStatistics == false">
                        <h2>Activate the telemetry data to see the usermap.</h2>
                        <br>
                        <h4>To activate the telemetry data, go to <a href="/#/options"><b>Options</b> and activate <b>"Send Telemetry data"</b></a></h4>
                        <small>After activation, it can take up to one minute for the data to become visible.</small>
                    </v-card-text>
                    <div v-else>
                        <p></p>
                        <UserMap :coords="userMapData" :height="userMapHeight" />
                    </div>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import Log from '../components/Log';
import ListInfo from '../components/ListInfo';
import Liveview from '../components/Liveview';

export default {
    name: 'Home',
    components: {
        Log,
        ListInfo,
        UserMap: () => import('../components/UserMap'),
        Liveview,
    },
    computed: {
        systemItems() {
            return this.$store.state.sysInfoData;
        },
        sensorItems() {
            return this.$store.state.sensorData;
        },
        buttonItems() {
            return this.$store.state.buttonData;
        },
        log() {
            return this.$store.state.logData.join('\n');
        },
        newVersionAvailable() {
            return this.$store.state.newVersionAvailable;
        },
        gitVersion() {
            return this.$store.state.gitVersion;
        },
        gitUpdateURL() {
            return this.$store.state.gitDownloadUrl;
        },
        userMapData() {
            return this.$store.state.userMapData.coords;
        },
        userMapError() {
            return this.$store.state.userMapData.error;
        },
        isDemoMode() {
            return this.$demoMode;
        },
        liveview() {
            return this.$store.state.liveviewData;
        },
        liveviewCanvasSettings() {
            return {
                ...this.$store.state.matrixSize,
                rectWidth: this.$vuetify.breakpoint.smAndDown ? 10 : 12,
                rectHeight: this.$vuetify.breakpoint.smAndDown ? 10 : 12,
                padding: 1,
            };
        },
        userMapHeight() {
            return this.$vuetify.breakpoint.smAndDown ? '280px' : '420px';
        },
        sendStatistics(){
            return this.$store.state.configData.sendTelemetry;
        },
    },
};
</script>
<style scoped>
.updateMessage {
    color: rgb(255, 102, 0);
    font-weight: bold;
}
</style>
