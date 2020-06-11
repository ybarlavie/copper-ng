<template>
    <div class="q-pa-md" :key="componentKey">
        <div v-if="document" class="q-gutter-md" style="max-width: 1024px">
            <h4>תעודה חיצונית: "{{document.arch_id}}" - מזהה: {{document.edoc_id}}</h4>
            <q-input rounded outlined v-model="document.arch_id" hint="מזהה בארכיב חיצוני" style="font-size: 19px;" :readonly="editable ? false : true" />
            <q-input rounded outlined v-model="document.material" hint="חומר" style="font-size: 19px;" :readonly="editable ? false : true" />
            <q-input rounded outlined v-model="document.label" hint="תגית" style="font-size: 19px;" :readonly="editable ? false : true" />
            <q-input rounded outlined v-model="document.date" type="date" hint="תגית" style="font-size: 19px;" :readonly="editable ? false : true" />
            <q-field rounded outlined hint="רמת אותנטיות">
                <q-slider v-model="document.authenticity" :min="0.1" :max="1.0" :step="0.1" color="light-green" :readonly="editable ? false : true" />
            </q-field>
            <q-input rounded outlined v-model="document.author" hint="מחבר" style="font-size: 19px;" :readonly="editable ? false : true" />
            <q-input rounded outlined v-model="document.edition" hint="מהדורה" style="font-size: 19px;" :readonly="editable ? false : true" />
            <q-input rounded outlined v-model="document.text" type="textarea" hint="טקסט" style="font-size: 19px;" :readonly="editable ? false : true" />

            <Keywords v-model="document.keywords" :parentId="document._id" :editable="editable" color="primary" hint="מילות מפתח"/>
        </div>
        <h4>תמונות</h4>
        <q-carousel v-model="slide" swipeable animated infinite ref="carousel" height="480px">
            <q-carousel-slide v-for="item in document.images"
                :key="item.label" 
                :name="item.label" 
                :img-src="item.url"
                @click="onImageClick(item.url)">
                <div class="absolute-bottom custom-caption">
                    <div class="text-h2">{{item.label}}</div>
                </div>
            </q-carousel-slide>
            <template v-slot:control>
                <q-carousel-control position="top-left" :offset="[18, 18]" class="q-gutter-xs">
                    <q-btn
                        push round dense color="orange" text-color="black" icon="arrow_right"
                        @click="$refs.carousel.next()"
                    />
                    <q-btn
                        push round dense color="orange" text-color="black" icon="arrow_left"
                        @click="$refs.carousel.previous()"
                    />
                </q-carousel-control>
            </template>
        </q-carousel>
    </div>
</template>
<script>
import Keywords from '../components/keywords.vue'
export default {
    components: {
        Keywords
    },
    props: ['docId', 'editable'],

    data() {
        return {
            componentKey: 0,
            document: {},
            slide: '',
        }
    },

    beforeMount() {
        this.fetchData();
    },

    methods: {
        onImageClick(url) {
            window.open(url);
        },

        onSearchClick(query) {
            this.$router.push({ name: 'resultGrid', params: { exclude: this.document._id, query: query } });
        },

        fetchData() {
            this.document = {};
            let docQ = {qv:"edoc_id",qe:this.docId};
            console.log("fetching document " + JSON.stringify(docQ));

            let dbURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'db/ext_documents';
            let that = this;
            $.ajax({
                type: "GET",
                url: dbURL + "?q=" + encodeURIComponent(JSON.stringify(docQ)),
                crossdomain: true,
                success: function (result) {
                    if (result.length > 0) {
                        that.document = result[0];
                        that.slide = that.document.images.length > 0 ? that.document.images[0].label : '';
                    }
                    that.componentKey += 1;
                },
                error: function (xhr, status, err) {
                    console.log("failed fetching document " + that.docId);
                    that.componentKey += 1;
                }
            });
        },
    },
}
</script>
<style>
</style>