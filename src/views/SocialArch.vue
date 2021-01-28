<template>
    <div v-if="docExists" class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-card bordered>
            <q-card-section>
                <div class="text-h6">{{ greeting }}</div>
                <div class="text-subtitle2">{{ stats }}</div>
            </q-card-section>

            <q-separator inset />

            <q-card-section>
                {{ abstract }}
            </q-card-section>
        </q-card>
        <q-badge label="האם" align="middle" color="purple" style="font-size: 21px; height: 23px;" />
        <q-card bordered>
            <q-card-section>
                <div class="text-h6">{{fromItemTypeDecr + " " + fromTitleGender + " '" + document.fromItem.title + "'" }}</div>
            </q-card-section>

            <q-separator inset />
            <q-card-section v-if="document.fromItem.text" style="font-size: 19px;">
                <q-badge label="טקסט" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                {{document.fromItem.text}}
            </q-card-section>

            <q-separator inset />            
            <q-card-section v-if="document.fromItem.remarks" style="font-size: 19px;">
                <q-badge label="הערות" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                {{document.fromItem.remarks}}
            </q-card-section>
        </q-card>

        <q-badge label="קשר" align="middle" color="grey" style="font-size: 15px; height: 15px;" />
        <q-badge :label="refDescr" align="middle" color="purple" style="font-size: 21px; height: 23px;" />

        <q-card bordered>
            <q-card-section>
                <div class="text-h6">{{toItemTypeDecr + " " + toTitleGender+ " '" + document.toItem.title + "'" }}</div>
            </q-card-section>

            <q-separator inset />
            <q-card-section v-if="document.toItem.text" style="font-size: 19px;">
                <q-badge label="טקסט" align="middle" color="grey" style="font-size: 15px; height: 15px;" />
                {{document.toItem.text}}
            </q-card-section>

            <q-separator inset />            
            <q-card-section v-if="document.toItem.remarks" style="font-size: 19px;">
                <q-badge label="הערות" align="middle" color="grey" style="font-size: 15px; height: 15px;" />
                {{document.toItem.remarks}}
            </q-card-section>
        </q-card>

        <q-card>
            <q-card-section>
                <q-badge label="תשובתך: " align="middle" color="purple" filled style="font-size: 19px; height: 25px;" />
            </q-card-section>
            <q-separator />
            <q-card-actions vertical>
                <q-radio keep-color v-model="userAnswer" val="yes" label="הקשר תקין" color="cyan" />
                <q-radio keep-color v-model="userAnswer" val="no" label="הקשר לא תקין" color="red" />
            </q-card-actions>
        </q-card>

        <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">    
            <div v-if="docExists">
                <q-btn label="שמירה" type="submit" color="primary"/>
                <q-btn label="לא יודע/ת לענות" type="reset" color="red" class="q-ml-sm" />
            </div>
        </q-form>
    </div>
</template>
<script>
export default {
    components: {
    },
    props: [],
    
    data: () => {
        return {
            document: null,
            refDescr: null,
            componentKey: 0,
            docExists: false,
            ajaxing: false,
            userAnswer: "no",

            greeting: null,
            stats: null,
            abstract: null,
            fromItemTypeDecr: null,
            fromTitleGender: null,
            toItemTypeDecr: null,
            toTitleGender: null
        }
    },

    beforeMount() {
        this.fetchData(true);
    },

    methods: {
        showNotif (ok, msg) {
            this.$q.notify({
                message: msg,
                color: ok ? 'green' : 'red'
            })
        },

        onSubmit () {
            let saURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'socialArch/updateAnswer/' + this.document.ref._id + "/" + this.userAnswer;
            let that = this;
            this.ajaxing = true;
            $.ajax({
                type: "GET",
                url: saURL,
                crossdomain: true,
                headers: {
                    "x-access-token": window.tokenData.token
                },
                success: function (result) {
                    that.ajaxing = false;
                    that.showNotif(true, "תשובתך נשמרה");
                    that.fetchData(true);
                },
                error: function (xhr, status, err) {
                    that.ajaxing = false;
                    that.componentKey += 1;
                    that.showNotif(false, "לא ניתן לשמור את תשובתך");
                }
            });
        },

        onReset () {
            this.fetchData(true);
        },

        fetchData(noisy) {
            console.log("fetching social arch query...");

            let saURL = window.apiURL.replace(this.$route.matched[0].path, '') + 'socialArch/getRandom';
            let that = this;
            this.ajaxing = true;
            $.ajax({
                type: "GET",
                url: saURL,
                crossdomain: true,
                headers: {
                    "x-access-token": window.tokenData.token
                },
                success: function (result) {
                    that.ajaxing = false;

                    var rt = window.store.ref_types.filter(t => t.type == result.ref.type)[0];
                    if (rt.toRegEx.source == rt.fromRegEx.source && rt.alias != rt.revAlias) {
                        that.refDescr = rt.revAlias + " או " + rt.alias;
                    } else if (result.fromItem.item_id.match(rt.fromRegEx) && result.toItem.item_id.match(rt.toRegEx)) {
                        that.refDescr = rt.alias;
                    } else {
                        that.refDescr = rt.revAlias;
                    }

                    var itemT = window.store.item_types[result.fromItem.item_id.substring(0,1)];
                    that.fromItemTypeDecr = itemT.s_heb;
                    that.fromTitleGender = itemT.gender == "female" ? "שכותרתה" : "שכותרתו";

                    itemT = window.store.item_types[result.toItem.item_id.substring(0,1)];
                    that.toItemTypeDecr = itemT.s_heb;
                    that.toTitleGender = itemT.gender == "female" ? "שכותרתה" : "שכותרתו";

                    that.document = result;
                    
                    that.greeting = "שלום, " + result.user.alias + ". תודה על עזרתך.";
                    that.stats = " עד כה עזרת בטיוב של " + result.stats + " קשרים. כל הכבוד !";
                    that.abstract = "הסוגיה הנוכחית עוסקת בקשר שבין " + that.fromItemTypeDecr + " " + that.fromTitleGender + " '" +that.document.fromItem.title + "'";
                    that.abstract += " לבין " + that.toItemTypeDecr + " " + that.toTitleGender + " '" + that.document.toItem.title + "'";

                    that.docExists = true;
                    if (noisy) {
                        that.showNotif(true, "השאלה מוכנה");
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