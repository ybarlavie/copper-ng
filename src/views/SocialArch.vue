<template>
    <div class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
            <div v-if="docExists" class="q-gutter-md" style="max-width: 1024px;">
                <q-badge :label="greeting" align="middle" color="purple" filled style="font-size: 19px; height: 25px;" />
                <q-badge label="האם הפריט מהסוג: " align="middle" color="purple" filled style="font-size: 19px; height: 25px;" />
                <q-badge :label="fromItemTypeDecr" align="middle" color="blue" filled style="font-size: 19px; height: 25px;" />
            </div>
            <div v-if="docExists" class="q-gutter-md" style="max-width: 1024px;">
                <q-badge label="שם" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                <q-badge :label="document.fromItem.name" align="middle" color="blue" style="font-size: 19px; height: 25px;" />
                <q-badge label="תווית" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                <q-badge :label="document.fromItem.label" align="middle" color="blue" style="font-size: 19px; height: 25px;" />
                <q-badge label="כותרת" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                <q-badge :label="document.fromItem.title" align="middle" color="blue" style="font-size: 19px; height: 25px;" />
                <q-input v-if="document.fromItem.text" rounded outlined v-model="document.fromItem.text" type="textarea" readonly="true" hint="טקסט" style="font-size: 19px;" />
                <q-input v-if="document.fromItem.remarks" rounded outlined v-model="document.fromItem.remarks" type="textarea" readonly="true" hint="הערות" style="font-size: 19px;" />
            </div>
            <div v-if="docExists" class="q-gutter-md" style="max-width: 1024px;">
                <q-badge :label="refDescr" align="middle" color="purple" filled style="font-size: 19px; height: 25px;" />
            </div>
            <div v-if="docExists" class="q-gutter-md" style="max-width: 1024px;">
                <q-badge label="שם" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                <q-badge :label="document.toItem.name" align="middle" color="green" style="font-size: 19px; height: 25px;" />
                <q-badge label="תווית" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                <q-badge :label="document.toItem.label" align="middle" color="green" style="font-size: 19px; height: 25px;" />
                <q-badge label="תווית" align="middle" color="grey" style="font-size: 15px; height: 17px;" />
                <q-badge :label="document.toItem.title" align="middle" color="green" style="font-size: 19px; height: 25px;" />
                <q-input v-if="document.toItem.text" rounded outlined v-model="document.toItem.text" type="textarea" readonly="true" hint="טקסט" style="font-size: 19px;" />
                <q-input v-if="document.toItem.remarks" rounded outlined v-model="document.toItem.remarks" type="textarea" readonly="true" hint="הערות" style="font-size: 19px;" />
            </div>
            <div v-if="docExists">
                <q-btn label="שמירה" type="submit" color="primary"/>
                <q-btn label="ביטול" type="reset" color="primary" flat class="q-ml-sm" />
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
            greeting: null,
            fromItemTypeDecr: null,
            toItemTypeDecr: null,
            refDescr: null,
            componentKey: 0,
            docExists: false,
            ajaxing: false,
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
                    
                    that.greeting = "שלום, " + result.user.alias + ". תודה על עזרתך.";
                    
                    var rt = window.store.ref_types.filter(t => t.type == result.ref.type)[0];
                    if (rt.toRegEx.source == rt.fromRegEx.source && rt.alias != rt.revAlias) {
                        that.refDescr = rt.revAlias + " או " + rt.alias;
                    } else if (result.fromItem.item_id.match(rt.fromRegEx) && result.toItem.item_id.match(rt.toRegEx)) {
                        that.refDescr = rt.alias;
                    } else {
                        that.refDescr = rt.revAlias;
                    }

                    that.fromItemTypeDecr = window.store.item_types[result.fromItem.item_id.substring(0,1)].s_heb;
                    that.toItemTypeDecr = window.store.item_types[result.toItem.item_id.substring(0,1)].s_heb;

                    that.document = result;

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