import ScoreCard from './ScoreCard';
import LevelManager from './LevelManager';
import LevelGenerator from './LevelGenerator';
import CheckboxGrid from './CheckboxGrid';
import Constants from './Constants';

import { 
    getTargetCountForLevel, 
    cellFishSelector,
    tauntSelector,
    penguinSelector,
    setLocalStorageAndUpdateDataBase,
    checkForUniqueUserName,
    calculateFinalScore,
    fetchLeaderboard,
    saveFeedbackToDB
} from './Util';

const scoreCard = new ScoreCard();
const levelManager = new LevelManager();

let gametimer = null;
const timeoutMap = new Map();
timeoutMap.set('levelSubmitTimeout', null);
timeoutMap.set('gridViewTimeout', null);
timeoutMap.set('tauntViewTimeout', null);

let currentSectionView = 'game-dashboard';

const showRules = function() {
    _showSectionById("game-rules");
}
document.getElementById('showRulesBtn').addEventListener('click', showRules);

const showUserConfigView = function() {
    if(localStorage.getItem(Constants.LOCALSTORAGE_USERNAME_KEY)) {
        const section = document.getElementById('game-returninguser');
        section.querySelector('#playerName').innerText = localStorage.getItem(Constants.LOCALSTORAGE_USERNAME_KEY);

        _showSectionById("game-returninguser");
    } else {
        _showSectionById("game-newuser");
    }
}
document.getElementById('userConfigBtn').addEventListener('click', showUserConfigView);
document.getElementById('createNewUserBtn').addEventListener('click', () => _showSectionById("game-newuser"));

const playReturningUser = function() {
    _startGame(localStorage.getItem(Constants.LOCALSTORAGE_USERNAME_KEY));
}
document.getElementById('playOldUserBtn').addEventListener('click', playReturningUser);

const playNewUser = function() {
    const nameField = document.getElementById('fname');
    const username = nameField.value.toLowerCase();
    const regex = new RegExp(Constants.USERNAME_REGEX);
    const responseEl = document.getElementById('usernameResponse');

    //Invalid username
    if(!username || username.length<5 || username.length>30 || !regex.test(username)) {
        nameField.style.animation = 'highlightcell 0.6s 2';
        responseEl.classList.remove('hideComponent');

        if (!username) {
            responseEl.innerText = `Even "He who must not be named" had a name.`;
        } else {
            responseEl.innerText = `Common, give us a cool name between 5-30 characters, and don't try anything spooky!`;
        }
        return;
    }

    responseEl.classList.add('hideComponent');
    _addLoadingIcon(document.getElementById('playNewUserBtn'));
    //Unique username from database
    checkForUniqueUserName(username)
    .then(res => {
        _removeLoadingIcon(document.getElementById('playNewUserBtn'));
        const responseEl = document.getElementById('usernameResponse');
        if (res.success) {
            if (res.data) {
                //say username already exists
                responseEl.classList.remove('hideComponent');
                responseEl.innerText = "This one's taken. Surely, you can be more creative!";
            } else {
                responseEl.classList.add('hideComponent');
                setLocalStorageAndUpdateDataBase(username); //submit default score 0 - create new user
                _startGame(username);
            }
        } else {
            responseEl.classList.remove('hideComponent');
            responseEl.innerText = "A big fat whale sat over the server. We are trying our best to get it rolling.";
        }
    });
}
document.getElementById('playNewUserBtn').addEventListener('click', playNewUser);

const levelSubmit = function(e) {
    if (e.target.id === "goBtn") { 
        document.getElementById('goBtn').disabled = true;
        document.getElementById('goBtn').style.opacity = 0.5;

        const validationStat = levelManager.validateAndReturnSelection();
        scoreCard.incrementMissed(validationStat.targetMissed.length);
        scoreCard.incrementScored(validationStat.targetCorrect.length);
        scoreCard.incrementWronged(validationStat.targetWrong.length);
        _displayValidationView(validationStat);
        _showScoreView();

        //show the answer validation for 2 seconds and then move on
        const levelSubmitTimeout = setTimeout(()=>{
            if (scoreCard._missed>15) {
                _gameOver();
            } else {
                ++levelManager._currentLevel;
                if(validationStat.targetMissed.length+validationStat.targetWrong.length>Constants.TAUNT_TOLERANCE)
                    _displayTauntView();
                else
                    _showGridView(levelManager._currentLevel);
            } 
        },2000);
        timeoutMap.set('levelSubmitTimeout', levelSubmitTimeout);
    } else if(e.target.id === "reBtn") { 
        //TODO: show warning and ask for confirmation
        scoreCard.reset();
        levelManager._currentLevel = 1;
        _gameTimer();
        _showGridView(levelManager._currentLevel);
    }
}
document.getElementById('levelSubmitBtns').addEventListener('click', levelSubmit);

/**
 * TODO: make fishes run fast out of screen
 */
// const fishClicked = function() {
//     console.log('fish clicked');
// }

// const fishesInAquarium = document.querySelectorAll('.fish-swimming');
// fishesInAquarium.forEach(fish => fish.addEventListener('click', fishClicked));

const cellClicked = function(e) {
    const grid_id = +e.target.id.split("_")[1];
    levelManager.updateSelectedSet(grid_id);
    e.target.classList.toggle('cell-catch');
}

const scoreMathHelp = function() {
    const scoreMathWindow = document.getElementById('scoreMathWindow');
    _showSectionById('scoreMathWindow');

    scoreMathWindow.querySelector('.close').addEventListener('click', () =>  _showSectionById('game-over'));
}
document.getElementById('scoreMathBtn').addEventListener('click', scoreMathHelp);

const getLeaderBoard = function() {
    const leaderboardWindow = document.getElementById('leaderboardWindow');
    _showSectionById('leaderboardWindow');
    leaderboardWindow.querySelector('.close').addEventListener('click', () =>  _showSectionById('game-over'));

    leaderboardWindow.querySelector('.loader').classList.remove('hideComponent');
    leaderboardWindow.querySelector('table').innerHTML = '';
    fetchLeaderboard()
    .then(res => {
        _showUserRank(res.data.userRank);
        _showLeaderboardView(true, res.data.topTen);
    })
    .catch(err => {
        console.log('Some error fetching leaderboard.');
        _showLeaderboardView(false);
    });
}
document.getElementById('leaderboardBtn').addEventListener('click', getLeaderBoard);

const gameControlBtnClicked = function(event) {
    const previousSectionView = currentSectionView;
    const target = event.target.id;

    const onCloseCallback = () => {
        _showSectionById(previousSectionView);
    };

    switch (target) {
        case 'musicBtn':
            _musicBtnClicked();
            break;
        case 'storyBtn':
            _showStoryView(onCloseCallback);
            break;
        case 'heartBtn':
            _showFeedbackView(onCloseCallback);
            break;
        default: 
            return;
    }
}
document.getElementById('game-controls').addEventListener('click', gameControlBtnClicked);

//////////////////// PRIVATE FUNCTIONS ////////////////////////
//two minute game timer
const _gameTimer = function() {
    //In case of Replay btn
    gametimer && clearInterval(gametimer);
    _displayTimerView(0, 3);

    let seconds = 60;
    let minutes = 2;
    gametimer = setInterval(()=> {
        --seconds;
        _displayTimerView(seconds, minutes);
        if (seconds === 0 && minutes === 0) {
            clearInterval(gametimer);
            _gameOver();
        }
        if (seconds === 0) {
            minutes--;
            seconds = 59;
        }
    }, 1000);
}

const _showSectionById = function(id) {
    currentSectionView = id;
    const sectionList = document.querySelectorAll('section');
    sectionList.forEach(section => {
        if(section.id === id) {
            section.classList.remove('hideComponent');
            section.classList.add('dashboard');
        } else {
            section.classList.remove('dashboard');
            section.classList.add('hideComponent');
        }
    });
}

const _startGame = function(username) {
    //TODO: remove onclick event listener from the floating fishes
    _constructAvatar(username);
    _showSectionById("game-playground");
    _toggleControlPanelView();
    _gameTimer();
    _showGridView(levelManager._currentLevel);
}

const _showGridView = function(level) {
    //show grid
    const levelMetrix = new LevelGenerator(level, getTargetCountForLevel(level));
    const grid = new CheckboxGrid(levelMetrix._gridSize, levelMetrix._gridSize);
    const centralGrid = document.querySelector('#centralGrid');
    
    //disable click while the fishes are visible
    centralGrid.removeEventListener('click', cellClicked); 
    grid.destructGrid(centralGrid);
    centralGrid.appendChild(grid.constructGrid());
    
    //show and hide fish after timeout, enable next button, enable cell click
    const targetSet = levelMetrix._targetLocations;
    levelManager._targetSet = targetSet;
    levelManager.clearSelectedSet();
    const cellStyle = cellFishSelector();
    for(let key of targetSet) {
        centralGrid.querySelector('#gridid_'+key).classList.add(cellStyle);
    }

    const gridViewTimeout = setTimeout(function(set, root, style){
        for(let key of set) {
            root.querySelector('#gridid_'+key).classList.remove(style);
        }
        document.getElementById('goBtn').disabled = false;
        document.getElementById('goBtn').style.opacity = 1;
        
        //enable click only when fishes dissappear
        root.addEventListener('click', cellClicked);
    }, levelMetrix._displayTime, targetSet, centralGrid, cellStyle);
    timeoutMap.set('gridViewTimeout', gridViewTimeout);

    //show level number
    _showLevelView();
    //show current score
    _showScoreView();

    //show next(disabled) and restart button
    document.getElementById('goBtn').disabled = true;
    document.getElementById('goBtn').style.opacity = 0.5;
    
}

const _gameOver = function() {
    //clear all timers/timeout
    timeoutMap.forEach((val, key) => clearTimeout(val));
    
    //display gameover view
    const finalscore = calculateFinalScore(scoreCard);
    _showSectionById('game-over');
    
    _showSubmitFeedbackBtn();
    _toggleControlPanelView();
    
    //update and display highscore
    document.getElementById('game-over-fed').innerText = scoreCard._scored;
    document.getElementById('game-over-starved').innerText = scoreCard._missed;
    document.getElementById('game-over-wasted').innerText = scoreCard._wronged;
    
    setLocalStorageAndUpdateDataBase(localStorage.getItem(Constants.LOCALSTORAGE_USERNAME_KEY), finalscore);
    
    document.getElementById('game-over-highscore').innerText = localStorage.getItem(Constants.LOCALSTORAGE_HIGHSCORE_KEY);
    const currentScoreEl = document.getElementById('current-score');
    currentScoreEl.innerText = finalscore;
    if(finalscore <= 0) currentScoreEl.classList.add('red-border-font');
    else currentScoreEl.classList.add('green-border-font');
}

const _constructAvatar = function(username) {
    document.querySelector('.player-name').innerText = username;
    document.getElementById('game-avatar').classList.remove('hideComponent');
}

/**
 * TODO
 */
// const _makeFishAnimationStatic = function() {
//     console.log('make fish animation static');
// }

const _addLoadingIcon = function(parentId) {
    parentId.querySelector('.loader').classList.remove('hideComponent');
}

const _removeLoadingIcon = function(parentId) {
    parentId.querySelector('.loader').classList.add('hideComponent');
}

const _showScoreView = function() {
    document.getElementById('scored').innerText = scoreCard._scored;
    document.getElementById('missed').innerText = scoreCard._missed;
}

const _showLevelView = function() {
    document.getElementById('game-level').innerText = `Level ${levelManager._currentLevel}`;
}

const _displayValidationView = function(validationArray) {
    const grid = document.getElementById('game-grid');
    for (let key of validationArray.targetMissed) {
        grid.querySelector('#gridid_'+key).classList.add('cell-missed');
    }
    
    for (let key of validationArray.targetCorrect) {
        grid.querySelector('#gridid_'+key).classList.add('cell-correct');
    }

    for (let key of validationArray.targetWrong) {
        grid.querySelector('#gridid_'+key).classList.add('cell-wrong');
    }
}

const _displayTimerView = function(sec, min) {
    const display = `${min}:${Math.trunc(sec/10)}${Math.trunc(sec%10)}`;
    document.getElementById('game-timer').innerText = display;
}

const _displayTauntView = function() {
    _showSectionById("game-taunts");
    document.querySelector('.taunt-bubble-text').innerText = tauntSelector();
    const penguin = document.getElementById('taunt-icon');
    penguin.removeAttribute('class');
    penguin.setAttribute('class', penguinSelector());

    const tauntViewTimeout = setTimeout(()=> {
        _showSectionById("game-playground");
        _showGridView(levelManager._currentLevel);
    }, 4000);
    timeoutMap.set('tauntViewTimeout', tauntViewTimeout);
}

const _showLeaderboardView = function(success, data=[]) {
    const leaderboardWindow = document.getElementById('leaderboardWindow');
    const tableView = leaderboardWindow.querySelector('table');
    let table;
    //inner table construction
    if(success) {
        table = `
        <tr>
            <th>#</th>
            <th>Savior</th>
            <th>Score</th>
        </tr>
        `;
        let row;
        for (let i=0; i<data.length; i++) {
            row = `
                <tr>
                    <td>${i+1}</td>
                    <td>${data[i].username}</td>
                    <td>${data[i].highscore}</td>
                </tr>
            `;
            table+=row;
        }
    } else {
        table = `<div class='red-border-font'>A killer shark attacked the server! We will update you next time. Don't worry, your highscore is safe though.</div>`;
    }
    
    leaderboardWindow.querySelector('.loader').classList.add('hideComponent');
    tableView.classList.remove('hideComponent');
    tableView.innerHTML = table;
}

const _toggleControlPanelView = function() {
    const controlPanelEl = document.getElementById('game-controls');
    if(controlPanelEl.style.display === 'none') {
        controlPanelEl.style.display = 'flex';
    } else {
        controlPanelEl.style.display = 'none';
    }
}

const _showSubmitFeedbackBtn = function() {
    document.getElementById('heartBtn').style.visibility = 'visible';
}

const _musicBtnClicked = function() {
    const audio = document.querySelector('.audio');
    const musicIcon = document.querySelector('#musicBtn');
    if(audio.paused) {
        audio.play();
        musicIcon.classList.remove('no-music');
        musicIcon.classList.add('music');
    } else {
        audio.pause();
        musicIcon.classList.remove('music');
        musicIcon.classList.add('no-music');
    }
}

const _showStoryView = function(closeCallback) {
    _showSectionById('gondoozStoryWindow');
    const storyWindow = document.getElementById('gondoozStoryWindow');
    storyWindow.querySelector('.close').addEventListener('click', closeCallback);
}

const _showFeedbackView = function(closeCallback) {
    _showSectionById('sendMessageWindow');
    const sendMessageWindow = document.getElementById('sendMessageWindow');
    const sendMessageBtn = sendMessageWindow.querySelector('#sendMsgBtn');
    sendMessageWindow.querySelector('.close').addEventListener('click', closeCallback);
    
    const onSendEventHandler = () => {
        const email = sendMessageWindow.querySelector("input[type='email']");
        const msg = sendMessageWindow.querySelector("textarea[id='message']");
        if(msg.value.length===0) {
            msg.style.animation = 'highlightcell 0.6s 2';
            return; 
        }

        sendMessageWindow.querySelector('.loader').classList.remove('hideComponent');
        saveFeedbackToDB(msg.value, email.value).then(res => {
            sendMessageWindow.querySelector('.loader').classList.add('hideComponent');
            
            if (res) {
                sendMessageBtn.classList.remove('send-msg');
                sendMessageBtn.classList.add('green-border-font');
                sendMessageBtn.innerText = "Thank you for writing to me!";
                sendMessageBtn.removeEventListener("click", onSendEventHandler);
            } else {
                sendMessageBtn.classList.add('red-border-font');
                sendMessageBtn.innerText = "A killer whale sat over the server! :P Next time!";
            }
        });
    };

    sendMessageBtn.addEventListener("click", onSendEventHandler);
}

const _showUserRank = function(rank) {
    document.getElementById('userRank').querySelector('span').innerText = rank;
}