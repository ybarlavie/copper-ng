export default function queryMongoAsync(component, collName, query) {
    return new Promise(function(resolve, reject) {
        let url = window.apiURL.replace(component.$route.matched[0].path, '') + 'db/' + collName;
        if (query) {
            url = url + "?q=" + encodeURIComponent(JSON.stringify(query))
        }
        let that = component;
        that.ajaxing = true;
        $.ajax({
            type: "GET",
            url: url,
            crossdomain: true,
            headers: {
                "x-access-token": window.tokenData.token
            },
            success: function (result) {
                that.ajaxing = false;
                resolve(result);
            },
            error: function (xhr, status, err) {
                that.ajaxing = false;
                reject(err);
            }
        });    
    });
}