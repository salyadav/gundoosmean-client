import axios from 'axios';

const CORRECT_SCORE = 10;
const MISSED_SCORE = -10;
const WRONGED_SCORE = -5;
const BASE_URL = "https://gundoosmean-server.herokuapp.com/";

const TARGET_COUNT_MAP = (function(){ //Map because - might want to add other attributes to level later
    const countMap = new Map();
    for (let lvl=1; lvl<=8; lvl++) {
        let count = lvl - Math.floor((lvl-1)/2);
        countMap.set(lvl, count);
    }

    for (let lvl=9; lvl<=16; lvl++) {
        let count = lvl - Math.floor((lvl-1)/2) - 1;
        countMap.set(lvl, count);
    }

    for (let lvl=17; lvl<=20; lvl++) {
        countMap.set(lvl, 10);
    }
    return countMap;
})();

const CELL_FISH_STYLE_CLASSES = [
    "cell-fish-1",
    "cell-fish-2",
    "cell-fish-3",
    "cell-fish-4",
    "cell-fish-5",
    "cell-fish-6",
    "cell-fish-7"
];

/**
 * TODO: bad practice - find a better way to do this
 */
const TAUNT_PENGUINE_STYLE_CLASSES = [
    "taunt-penguine-1",
    "taunt-penguine-2",
    "taunt-penguine-3",
    "taunt-penguine-4",
    "taunt-penguine-5"
];

/**
 * TODO: move it to database and fetch from there once asynchronously while starting the game
 * Sarcasm generator API
*/
const TAUNTS = [
    "Sigh. You don't even have to move from your couch to do this. Can't you do better?",
    "This is what happens when you use your brain as a stepney.",
    "Look. Penguins can't be vegan okay? Go feed my fish.",
    "Hey you're melting all my ice and now you're starving my fish ????",
    "Ooooh good job. If you were trying to disappoint.",
    "With memory like that, are you sure you remember your name?",
    "Yo brain so smoll, it's a floppy disk.",
    "Okay you really need to get your brain tested. This isn't normal.",
    "You should have stayed as apes -_-",
    "Twinkle Twinkle tiny brain, Why you give me so much pain?",
    "Are you trying to make snails feel fast?",
    "Your neurons fire like chilled water."
];

let TAUNTS_UNUSED = TAUNTS.slice();

const submitScore = () => { 
    const url = BASE_URL + "leaderboard/submitScore";
    let tryAgainFlag = false;
    const username = localStorage.getItem('gundooz-username');
    const highscore = localStorage.getItem('gundooz-highscore');
    
    const submitScoreAjax = () => {
        axios.post(url, {
            username: username,
            highscore: highscore || 0
        }).then(res => {
            console.log("Successfully saved user score.");
        })
        .catch(err => {
            if(!tryAgainFlag) {
                console.warn("Sorry, we weren't able to save your score in the database. But we will try again.");
                setTimeout(()=> {
                    tryAgainFlag = true;
                    console.warn("There was some evil doings last time while saving your score. Trying again...");
                    submitScoreAjax();
                }, 5000);
            } else {
                console.error("Sorry, we weren't able to add you to our database. But you can always beat your older highscore.");
            }
        });
    }

    username && submitScoreAjax();
}

export const setLocalStorageAndUpdateDataBase = (username, highscore=0) => {
    localStorage.setItem('gundooz-username', username);
    const currenthighscore = localStorage.getItem('gundooz-highscore');
    if(!currenthighscore || (currenthighscore < highscore)) {
        localStorage.setItem('gundooz-highscore', highscore);
    }
    try {
        submitScore();
    } catch(e) {
        console.log('Exception caught at submitscore');
    }
}

export const getTargetCountForLevel = (lvl=1) => {
    return lvl<=20 ? TARGET_COUNT_MAP.get(lvl) : 12;
}

export const cellFishSelector = () => {
    const index = randomIntGenerator(CELL_FISH_STYLE_CLASSES.length);
    return CELL_FISH_STYLE_CLASSES[index];
}

export const tauntSelector = () => {
    if (TAUNTS_UNUSED.length<1) TAUNTS_UNUSED = TAUNTS.slice();
    const index = randomIntGenerator(TAUNTS_UNUSED.length);
    const taunt = TAUNTS_UNUSED[index];
    TAUNTS_UNUSED.splice(index, 1);
    return taunt;
}

export const penguinSelector = () => {
    const index = randomIntGenerator(TAUNT_PENGUINE_STYLE_CLASSES.length);
    return TAUNT_PENGUINE_STYLE_CLASSES[index];
}

export const stringToHtml = str => {
    const parser = new DOMParser();
    const el = parser.parseFromString(str, 'text/html');
    return el.body;
}

//returns a promise
export const checkForUniqueUserName = (username) => {
    const url = BASE_URL + "leaderboard/checkUsername";
    return axios.get(url, {
        params: {
            username: username
        }
    }).then(res => {
        console.log("usercheck successful.");
        return {
            success: true,
            data: res.data
        };
    }). catch(err => {
        console.error("usercheck failed.");
        return {
            success: false,
            data: err
        };
    });
}

export const fetchLeaderboard = () => {
    const url = BASE_URL + "leaderboard/getTopTen";
    return axios.get(url);
}

export const randomIntGenerator = limit => {
    return Math.floor(Math.random()*limit);
}

export const calculateFinalScore = (scorecard) => {
    const finalscore = 
        (scorecard._scored * CORRECT_SCORE) +
        (scorecard._missed * MISSED_SCORE) + 
        (scorecard._wronged * WRONGED_SCORE);
    return finalscore;
}

export const saveFeedbackToDB = (feedback, email = '') => {
    const username = localStorage.getItem('gundooz-username');
    const url = BASE_URL + "feedback/submitFeedback";
    return axios.post(url, {
        username: username, 
        feedback:feedback, 
        email: email
    }).then(res => {
        console.log("Feedback submitted successfully!");
        return true;
    }).catch(err => {
        console.log("Failed to submit feedback. :(");
        return false;
    });
}