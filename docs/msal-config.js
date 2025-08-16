// Configuration for MSAL.js authentication
const msalConfig = {
    auth: {
        clientId: "<YOUR_AZURE_AD_APP_CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<YOUR_TENANT_ID>",
        redirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    }
};

const loginRequest = {
    scopes: [
        "openid",
        "profile",
        "User.Read",
        "offline_access",
        "Files.ReadWrite.All" // Required for Graph Excel logging
    ]
};
