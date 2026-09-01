function getRelease(companyInfo){
    $.ajax({
        type: "GET",
        url: "/kpos/api/sentry/front",
        dataType: "json",
        success: function(json){
            var data = json.data;
            if(data && data.enabled === 'on'){
                var version =  companyInfo.appInfo && companyInfo.appInfo.version;
                if(version){
                    version = version.substr(0,version.lastIndexOf('.'));
                }
                Sentry.init({
                    dsn: "http://1689a154468e43a5d55f49a768621c11@54.91.239.61:9000/3",
                    release: version,
                    environment: data.environment,
                    tracesSampleRate: 1.0,
                    replaysSessionSampleRate: 0.1,
                    replaysOnErrorSampleRate: 1.0,
                    initialScope:  {
                        tags:{"mid" : companyInfo.merchantId}
                    },
                    integrations: [
                        Sentry.browserTracingIntegration()
                    ],
                });
            }
        }
    });
}

function getCompanyInfo(){
    $.ajax({
        type: "GET",
        url: "/kpos/webapp/store/fetchCompanyProfile",
        dataType: "json",
        success: function(data){
            getRelease(data && data.company)
        }
    });
}

getCompanyInfo();

