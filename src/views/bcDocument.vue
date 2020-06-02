<template>
    <div class="q-pa-md" :key="componentKey">
        <div class="q-gutter-md" style="max-width: 1024px">
            <h4>תעודה: "{{document.title}}" - מזהה: {{document.doc_id}}</h4>
            <q-field filled>
                <template v-slot:control>
                    <div class="self-center full-width no-outline" style="font-size: 19px;" tabindex="0">{{document.arch_id}}</div>
                    <label>מזהה בארכיב בר-כוכבא</label>
                </template>
            </q-field>
            <q-field filled>
                <template v-slot:control>
                    <div class="self-center full-width no-outline" style="font-size: 19px;" tabindex="0">{{document.material}}</div>
                    <label>חומר</label>
                </template>
            </q-field>
            <q-field filled>
                <template v-slot:control>
                    <div class="self-center full-width no-outline" style="font-size: 19px;" tabindex="0">{{document.label}}</div>
                    <label>תגית</label>
                </template>
            </q-field>
            <q-field filled>
                <template v-slot:control>
                    <div class="self-center full-width no-outline" style="font-size: 19px;" tabindex="0">{{document.date}}</div>
                    <label>תאריך</label>
                </template>
            </q-field>
            <q-field filled>
                <template v-slot:control>
                    <q-slider v-model="document.authenticity" :min="0.1" :max="1.0" :step="0.1" label label-always color="light-green" />
                    <label>רמת אותנטיות</label>
                </template>
            </q-field>
            <q-input v-model="document.text" filled type="textarea" style="font-size: 19px;" />
            <label>טקסט</label>
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

let apiURL = window.location.origin + window.location.pathname;
if (!apiURL.endsWith('/')) apiURL += '/';
apiURL += 'api/db/documents';

export default {
    props: ['docId'],

    data() {
        return {
            componentKey: 0,
            document: {},
            slide: '',
        }
    },

    mounted() {
        this.fetchData();
    },

    methods: {
        onImageClick(url) {
            window.open(url);
        },
        fetchData() {
            this.document = null;
            let docQ = {qv:"doc_id",qe:this.docId};
            console.log("fetching document " + JSON.stringify(docQ));
            let that = this;
            $.ajax({
                type: "GET",
                url: apiURL + "?q=" + encodeURIComponent(JSON.stringify(docQ)),
                crossdomain: true,
                success: function (result) {
                    if (result.length > 0) {
                        that.document = result[0];
                        that.slide = that.document && that.document.images && that.document.images.length > 0 ? that.document.images[0].label : '';
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
section {
    border: 1px;
}
</style>