<template>
    <div class="q-pa-md" :key="componentKey">
        <q-linear-progress v-if="ajaxing" indeterminate />
        <q-form @submit="onSubmit" class="q-gutter-md" style="max-width: 500px;">
            <q-input rounded outlined v-model="email" hint="כתובת דואל" style="font-size: 25px;" dir="ltr" />
            <q-input rounded outlined v-model="authCode" hint="קוד עדכני של Google Authenticator" style="font-size: 25px;" dir="ltr" />
            
            <div class="q-pa-md q-gutter-md">
                <q-btn v-if="submitOK" label="בצע הזדהות" type="submit" color="primary" />
                <q-btn v-if="email!='' && authCode=='reset'" label="בקש QRCode" @click="onReqQR" color="primary" />
                <q-btn v-if="isLoggedIn" label="ניקוי הזדהות ישנה" @click="onClear" color="primary" />
            </div>
        </q-form>

    </div>
</template>
<script>
import AppVue from '../App.vue';

export default {
    data: () => {
        return {
            componentKey: 0,
            email: '',
            authCode: '',
            ajaxing: false,
        }
    },

    computed: {
        submitOK() {
            return this.email.indexOf('@') > 0 && this.authCode.length == 6 && !isNaN(this.authCode);
        },

        isLoggedIn () {
            try {
                window.tokenData = JSON.parse(window.localStorage.getItem(window.JWT_COOKIE));
                return (window.tokenData && window.tokenData.expires > Math.floor(Date.now() / 1000));
            } catch(err) {
                return false;
            }
        }
    },

    methods: {
        showNotif (ok, msg) {
            this.$q.notify({
                message: msg,
                color: ok ? 'green' : 'red'
            })
        },

        onEnter() {
            this.$router.push({ path : '/' });
        },

        onClear() {
            window.tokenData = {};
            window.localStorage.setItem(window.JWT_COOKIE, "");
        },

        onReqQR() {
            window.tokenData = {};
            window.localStorage.setItem(window.JWT_COOKIE, "");

            console.log('requesting QR for: ' + this.email);
            let verifyUrl =  window.apiURL.replace(this.$route.matched[0].path, '') + 'auth/reqQR';
            let authURL = `${verifyUrl}/${this.email}`;

            let that = this;
            this.ajaxing = true;
            $.ajax({
                type: "GET",
                url: authURL,
                crossdomain: true,
                success: function (result) {
                    that.showNotif(false, `הבקשה נקלטה, הודעה נשלחה לדואל ${that.email}`);
                    that.ajaxing = false;
                    that.componentKey += 1;
                },
                error: function (xhr, status, err) {
                    that.showNotif(false, "ההזדהות נכשלה");
                    that.ajaxing = false;
                    that.componentKey += 1;
                }
            });
        },

        onSubmit () {
            this.onClear();

            let verifyUrl =  window.apiURL.replace(this.$route.matched[0].path, '') + 'auth/verifyTOTP';
            let authURL = `${verifyUrl}/${this.email}?t=${this.authCode}`;
            console.log('authing: ' + authURL);
            let that = this;
            this.ajaxing = true;
            $.ajax({
                type: "GET",
                url: authURL,
                crossdomain: true,
                success: function (result) {
                    console.log("login OK: " + JSON.stringify(result));
                    window.localStorage.setItem(window.JWT_COOKIE, JSON.stringify(result));
                    window.tokenData = JSON.parse(window.localStorage.getItem(window.JWT_COOKIE));
                    that.ajaxing = false;
                    that.componentKey += 1;

                    that.$root.$emit('login-complete', true);
                    
                    that.$nextTick().then(function () {
                        that.$router.push({ path : '/' });
                    });
                },
                error: function (xhr, status, err) {
                    that.showNotif(false, "ההזדהות נכשלה");
                    that.ajaxing = false;
                    that.componentKey += 1;

                    that.$root.$emit('login-complete', false);
                }
            });
        },
    }
}
</script>