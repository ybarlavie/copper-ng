<template>
    <mdb-container>
        <div :key="componentKey" class="card">
        <h1>תעודה: "{{document.title}}" - מזהה: {{document.doc_id}}</h1>
        <h2>מזהה בארכיב בר כוכבא: "{{document.arch_id}}"</h2>
        <h2>חומר: {{document.material}}</h2>
        <h2>תגית: {{document.label}}</h2>
        <h2>תאריך: {{document.date}}</h2>
        <h2>רמת אותנטיות: {{document.authenticity}}</h2>
        <mdb-row class="align-items-center">
            <mdb-col sm="12">
                <mdb-input outline style="height: 130px;" type="textarea" label="טקסט" v-model="document.text" />
            </mdb-col>
        </mdb-row>
        <h2>תמונות:</h2>
        <Imgs v-bind:images="document.images" />
        </div>
    </mdb-container>
</template>
<script>
import Imgs from '../components/Images.vue';
import { mdbContainer, mdbRow, mdbInput, mdbCol, mdbIcon } from "mdbvue";

let apiURL = window.location.origin + window.location.pathname;
if (!apiURL.endsWith('/')) apiURL += '/';
apiURL += 'api/db/documents';

export default {
    props: ['docId'],

    components: {
        Imgs,
        mdbContainer,
        mdbRow,
        mdbInput,
        mdbCol,
        mdbIcon
    },

    data() {
        return {
            componentKey: 0,
            document: {},
        }
    },

    mounted() {
        this.fetchData();
    },

    methods: {
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
.card {
    direction: rtl;
    display: flex;
    flex-direction: column;
}
img {
  max-width: 600px;
  height: auto;
}
</style>