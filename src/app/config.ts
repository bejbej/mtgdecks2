export const config = {
    types: ["conspiracy", "creature", "artifact", "enchantment", "battle", "planeswalker", "land", "instant", "sorcery"],
    statCategories: [
        { name: "cmc", types: ["creature", "artifact", "enchantment", "battle", "planeswalker", "instant", "sorcery"] }
    ],
    localStorage: {
        prefix: "mtgdecks2-",
        accessToken: "access_token",
        identity: "identity",
        tags: "tags"
    },
    auth: {
        clientId: "762466157003-hq2jn040hivudvem4n0jjas9edu02ruj.apps.googleusercontent.com",
        authUrl: "https://mtgdecks-api.herokuapp.com/api/auth/google2",
        issuer: "https://accounts.google.com",
        redirectUri: window.location.origin + window.location.pathname + "callback.html",
        scope: "email"
    },
    enableHover: true,
    decksUrl: "https://mtgdecks-api.herokuapp.com/api/decks",
    imagesUrl: "https://c1.scryfall.com/file/scryfall-cards/border_crop"
};

(function () {
    let lastMouseOverEvent: Date = undefined;
    
    let enableHover = () => {
        if (lastMouseOverEvent === undefined) {
            lastMouseOverEvent = new Date();
        } else if (new Date().getTime() - lastMouseOverEvent.getTime() < 100) {
            config.enableHover = true;
            document.body.removeEventListener("mouseover", enableHover);
            document.body.addEventListener("touchstart", disableHover);
        } else {
            lastMouseOverEvent = new Date();
        }
    };

    let disableHover = () => {
        config.enableHover = false;
        document.body.removeEventListener("touchstart", disableHover);
        document.body.addEventListener("mouseover", enableHover);
    }

    disableHover();
}());