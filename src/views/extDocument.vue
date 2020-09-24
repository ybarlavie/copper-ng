<template>
    <div class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
            <div v-if="document" class="q-gutter-md" style="max-width: 1024px;">
                <div v-if="docExists">
                    <q-btn push round dense color="green" text-color="black" icon="add" @click="startAdd">
                        <q-tooltip outline content-class="bg-purple" content-style="font-size: 16px" :offset="[10, 10]">
                            יצירת מסמך חדש
                        </q-tooltip>
                    </q-btn>
                    <q-btn push round dense color="orange" text-color="black" :icon="editable ? 'cancel' : 'edit'" @click="toggleEditable()">
                        <q-tooltip outline content-class="bg-purple" content-style="font-size: 16px" :offset="[10, 10]">
                            {{ editable
                                ?
                                'ביטול עריכה'
                                :
                                'עריכת המסמך' }}
                        </q-tooltip>
                    </q-btn>
                    <h4>תעודה חיצונית: "{{document.title}}" - מזהה: {{document.edoc_id}}</h4>
                </div>
                <div v-else>
                    <h4>תעודה חיצונית חדשה</h4>
                </div>

                <q-input rounded outlined v-model="document.arch_id" hint="מזהה בארכיב חיצוני" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-input rounded outlined v-model="document.title" hint="כותרת" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-input rounded outlined v-model="document.material" hint="חומר" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-input rounded outlined v-model="document.label" hint="תגית" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-input rounded outlined v-model="document.date" type="date" hint="תאריך" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-field rounded outlined hint="רמת אותנטיות">
                    <q-slider v-model="document.authenticity" :min="0.1" :max="1.0" :step="0.1" color="light-green" :readonly="editable ? false : true" />
                </q-field>
                <q-input rounded outlined v-model="document.author" hint="מחבר" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-input rounded outlined v-model="document.edition" hint="מהדורה" style="font-size: 19px;" :readonly="editable ? false : true" />
                <q-input rounded outlined v-model="document.text" type="textarea" hint="טקסט" style="font-size: 19px;" :readonly="editable ? false : true" />

                <Keywords v-model="document.keywords" :parentId="document._id" :editable="editable" color="primary" hint="מילות מפתח"/>
                
                <LinksEditor :fromEntity="document" :editable="editable && state !== 'ADD'" color="primary" hint="קשרים" />

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
import LinksEditor from '../components/linksEditor.vue'

export default {
    components: {
        Keywords,
        LinksEditor
    },
    props: ['itemId', 'state', 'collName'],
    
    data: () => {
        return {
            componentKey: 0,
            document: { keywords: [] },
            origDoc: {},
            slide: '',
            ajaxing: false,
            editable: false,
            docExists: false,
        }
    },

    beforeMount() {
        if (this.state === "ADD")
        {
            this.startAdd();
        }
        else
        {
            this.fetchData();
        }
    },

    methods: {
        startAdd() {
            this.document = { keywords: [] };
            this.origDoc = {};
            this.editable = true;
            this.docExists = false;
            this.slide = '';
            this.ajaxing = false;
        },

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
                    "Content-Type": "application/json",
                    "x-access-token": window.tokenData.token
                },
                "data": JSON.stringify(this.document),
            };

            var that = this;
            this.ajaxing = true;
            console.log('ajaxing up!');
            $.ajax(settings).done(function (response) {
                that.showNotif(true, "השמירה הצליחה");
                that.editable = false;
                that.fetchData();
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
            this.document = {};
            this.origDoc = {};
            this.docExists = false;
            let docQ = { qv:"item_id", qe:this.itemId };
            console.log("fetching document " + JSON.stringify(docQ));

            let dbURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'db/' + this.collName;
            let that = this;
            this.ajaxing = true;
            $.ajax({
                type: "GET",
                url: dbURL + "?q=" + encodeURIComponent(JSON.stringify(docQ)),
                crossdomain: true,
                headers: {
                    "x-access-token": window.tokenData.token
                },
                success: function (result) {
                    that.ajaxing = false;
                    if (result.length > 0) {
                        that.document = result[0];
                        that.origDoc = JSON.parse(JSON.stringify(that.document));
                        that.slide = (that.document.images && that.document.images.length > 0) ? that.document.images[0].label : '';

                        that.docExists = true;
                        if (noisy) {
                            that.showNotif(true, "המסמך נטען");
                        }
                    }
                    that.componentKey += 1;
                },
                error: function (xhr, status, err) {
                    that.ajaxing = false;
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