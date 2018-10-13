export const config = {
    types: ["creature", "artifact", "enchantment", "planeswalker", "land", "instant", "sorcery"],
    statCategories: [
        { name: "cmc", types: ["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"] }
    ],
    localStorage: {
        prefix: "mtgdecks2",
        user: "mtgdecks2-user",
        tags: "mtgdecks2-tags",
        cards: "mtgdecks2-cards-v1",
        token: "mtgdecks2-token"
    },
    authClients: {
        google: {
            authUrl: "https://mtgdecks-api.herokuapp.com/api/auth/google",
            clientId: "762466157003-hq2jn040hivudvem4n0jjas9edu02ruj.apps.googleusercontent.com",
            redirectUri: window.location.origin + window.location.pathname
        }
    },
    cardCacheLimit: 1000,
    cardExpirationMs: 259200000, //3 days
    enableHover: true,
    cardsUrl: "https://mtgdecks-api.herokuapp.com/api/cards",
    decksUrl: "https://mtgdecks-api.herokuapp.com/api/decks",
    usersUrl: "https://mtgdecks-api.herokuapp.com/api/users",
    imagesUrl: "https://img.scryfall.com/cards/border_crop/{imageUri}.jpg"
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