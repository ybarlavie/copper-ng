<template>
    <div class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
            <div v-if="document" class="q-gutter-md" style="max-width: 1024px;">
                <q-btn push round dense color="orange" text-color="black" :icon="editable ? 'cancel' : 'edit'" @click="toggleEditable()">
                    <q-tooltip outline content-class="bg-purple" content-style="font-size: 16px" :offset="[10, 10]">
                        {{ editable
                            ?
                            'ביטול עריכה'
                            :
                            'עריכת המסמך' }}
                    </q-tooltip>
                </q-btn>
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
            <div v-if="editable">
                <q-btn label="שמירה" type="submit" color="primary"/>
                <q-btn label="ביטול" type="reset" color="primary" flat class="q-ml-sm" />
            </div>
        </q-form>
    </div>
</template>
<script>
import Keywords from '../components/keywords.vue'

export default {
    components: {
        Keywords
    },
    props: ['idCol', 'docId', 'collName'],
    
    data() {
        return {
            componentKey: 0,
            document: {},
            origDoc: {},
            slide: '',
            ajaxing: false,
            editable: false,
            docExists: false,
        }
    },

    beforeMount() {
        this.fetchData();
    },

    methods: {
        toggleEditable() {
            this.editable = !this.editable;
            if (!this.editable) {
                this.fetchData();
            }
        },

        showNotif (ok, msg) {
            this.$q.notify({
                message: msg,
                color: ok ? 'green' : 'red'
            })
        },

        onSubmit () {
            if (Object.entries(this.document).toString() === Object.entries(this.origDoc).toString()) {
                this.showNotif(false, "לא בוצעו שינויים");
                return;
            }
            var settings = {
                "url": window.apiURL.replace(this.$route.matched[0].path, '') + 'db/' + this.collName,
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify(this.document),
            };

            var that = this;
            this.ajaxing = true;
            console.log('ajaxing up!');
            $.ajax(settings).done(function (response) {
                that.showNotif(true, "השמירה הצליחה");
            })
            .fail(function(err) {
                console.log('error' +  JSON.stringify(err))
                that.showNotif(false, "השמירה נכשלה");
            })
            .always(function() {
                that.ajaxing = false;
            });
        },

        onReset () {
            this.fetchData(true);
        },

        onImageClick(url) {
            window.open(url);
        },

        onSearchClick(query) {
            this.$router.push({ name: 'resultGrid', params: { exclude: this.document._id, query: query } });
        },

        fetchData(noisy) {
            this.ajaxing = true;
            this.document = {};
            this.origDoc = {};
            this.docId = this.docId || this.$route.query.docId;
            let docQ = {qv:this.idCol,qe:this.docId};
            console.log("fetching document " + JSON.stringify(docQ));

            let dbURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'db/' + this.collName;
            let that = this;
            $.ajax({
                type: "GET",
                url: dbURL + "?q=" + encodeURIComponent(JSON.stringify(docQ)),
                crossdomain: true,
                success: function (result) {
                    that.ajaxing = false;
                    if (result.length > 0) {
                        that.document = result[0];
                        that.origDoc = JSON.parse(JSON.stringify(that.document));
                        that.slide = that.document.images.length > 0 ? that.document.images[0].label : '';
                    }
                    that.componentKey += 1;
                    if (noisy) {
                        that.showNotif(true, "המסמך נטען");
                    }
                },
                error: function (xhr, status, err) {
                    that.ajaxing = false;
                    console.log("failed fetching document " + that.docId);
                    that.componentKey += 1;
                    if (noisy) {
                        that.showNotif(false, "טעינה נכשלה");
                    }
                }
            });
        },
    },
}
</script>
<style>
</style>