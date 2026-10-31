const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Vue = require('vue');

function load(file, context) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
        .split('<script>')[1].split('</script>')[0]
        .replace(/^import .*;$/gm, '').replace('export default', 'this.component =');
    vm.runInNewContext(source, context);
    return context.component;
}

(async () => {
    const observers = [];
    const context = {
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
            observe(target) { this.targets.add(target); }
            unobserve(target) { this.targets.delete(target); }
            disconnect() { this.targets.clear(); }
        },
    };
    const component = load('src/components/GalleryViewportItem.vue', context);
    const items = Array.from({ length: 500 }, () => {
        const item = new Vue(component);
        item.$el = { getBoundingClientRect: () => ({ height: 374 }) };
        component.mounted.call(item);
        return item;
    });
    assert.equal(observers.length, 1, 'Placeholders must share one observer');
    assert(items.every(item => !item.active), 'Do not mount offscreen contents initially');
    // Scroll through a large gallery and back: mounted content must not accumulate.
    for (const start of [0, 50, 100, 300, 480, 250, 0]) {
        observers[0].callback(items.map((item, index) => ({
            target: item.$el, isIntersecting: index >= start && index < start + 20,
        })));
        assert.equal(items.filter(item => item.active).length, 20);
    }
    assert.equal(items[100].placeholderHeight, 374, 'Retain measured height when unloading');
    items[0].pinned = true;
    await Vue.nextTick();
    observers[0].callback([{ target: items[0].$el, isIntersecting: false }]);
    assert(items[0].active, 'Keep an open information dialog mounted');
    items[0].pinned = false;
    await Vue.nextTick();
    assert(!items[0].active, 'Release a pinned card once its dialog closes');
    items.forEach(item => item.$destroy());
    assert.equal(observers[0].targets.size, 0, 'Release observer targets on navigation/search');

    const fallbackComponent = load('src/components/GalleryViewportItem.vue', {});
    const fallback = new Vue(fallbackComponent);
    fallbackComponent.mounted.call(fallback);
    assert(fallback.active, 'Keep gallery usable without IntersectionObserver');
    fallback.$destroy();

    let cleared = 0, disconnected = 0, removed = 0;
    const canvas = load('src/components/BmpCanvas.vue', {
        clearInterval: () => cleared++,
        document: { removeEventListener: () => removed++ },
    });
    const bitmap = {
        animationTimer: 42, frames: [[1], [2]],
        preloadObserver: { disconnect: () => disconnected++ },
        visibilityObserver: { disconnect: () => disconnected++ },
    };
    bitmap.stopAnimation = canvas.methods.stopAnimation.bind(bitmap);
    canvas.beforeDestroy.call(bitmap);
    assert.equal(cleared, 1);
    assert.equal(disconnected, 2);
    assert.equal(removed, 1);
    assert.equal(bitmap.frames, null, 'Release parsed frames when a card unmounts');
    // Render the actual gallery template: filtering used to produce a negative
    // v-for count for placeholders, aborting Vue's render for fewer than 24 hits.
    const galleryComponent = load('src/views/Gallery.vue', {
        actionFeedback: {}, notify() {}, BmpCanvas: {}, BmpDialog: {}, GalleryViewportItem: {},
    });
    const gallerySource = fs.readFileSync(path.join(__dirname, '../src/views/Gallery.vue'), 'utf8');
    const compiled = require('vue-template-compiler').compileToFunctions(
        gallerySource.split('<template>')[1].split('</template>')[0]
    );
    const records = Array.from({ length: 101 }, (_, id) => ({ id, name: `Bitmap ${id}` }));
    const gallery = new Vue({
        ...galleryComponent, ...compiled,
        beforeCreate() {
            this.$store = Vue.observable({ state: { bmpsFromAPI: records, socket: { isConnected: true } } });
        },
    });
    gallery.automaticLoading = true;
    const renderErrors = [];
    const previousErrorHandler = Vue.config.errorHandler;
    Vue.config.errorHandler = error => renderErrors.push(error);
    try {
        for (const count of [0, 1, 23, 24, 25]) {
            gallery.$store.state.bmpsFromAPI.splice(0, records.length,
                ...Array.from({ length: count }, (_, id) => ({ id, name: 'Match' })));
            gallery.message = 'Match';
            await Vue.nextTick();
            gallery._render();
            assert.equal(gallery.getBMPs.length, count);
            assert.equal(gallery.placeholderCount, count > 24 ? count - 24 : 0);
            assert.equal(gallery.hasMoreBMPs, count > 24);
        }
        records.splice(0, records.length,
            ...Array.from({ length: 101 }, (_, id) => ({ id, name: `Bitmap ${id}` })));
        gallery.message = ''; await Vue.nextTick();
        gallery.visibleCount = 96;
        gallery.message = '100'; await Vue.nextTick();
        gallery._render();
        assert.equal(gallery.visibleCount, 24, 'Search resets the batch after scrolling');
        assert.equal(gallery.visibleBMPs.length, 1);
        assert.equal(gallery.visibleBMPs[0].id, 100, 'Search includes entries not yet displayed');
        gallery.message = 'no results'; await Vue.nextTick(); gallery._render();
        assert.equal(gallery.visibleBMPs.length, 0);
        gallery.message = ''; await Vue.nextTick(); gallery._render();
        assert.equal(gallery.visibleBMPs.length, 24, 'Clearing search restores the initial batch');
        assert(gallery.hasMoreBMPs);
        assert.equal(renderErrors.length, 0, renderErrors.map(error => error.message).join(', '));
    } finally {
        Vue.config.errorHandler = previousErrorHandler;
        gallery.$destroy();
    }
    console.log('Gallery tests passed: viewport lifecycle, resource release, search rendering, result boundaries and clearing search after scrolling.');
})().catch(error => { console.error(error); process.exitCode = 1; });
