export default class LevelManager {
    constructor() {
        this._currentLevel = 1;
        this._targetSet = new Set();
        this._selectedSet = new Set();
    }

    get currentLevel() {
        return this._currentLevel;
    }

    get targetSet() {
        return this._targetSet;
    }

    get selectedSet() {
        return this._selectedSet;
    }

    set currentLevel(level) {
        this._currentLevel = level;
    }

    set targetSet(set) {
        this._targetSet.clear();
        this._targetSet = set;
    }

    set selectedSet(set) {
        this._selectedSet.clear();
        this._selectedSet = set;
    }

    nextLevel() {
        return ++this._currentLevel;
    }

    resetLevel() {
        this._currentLevel = 1;
    }

    updateSelectedSet(cell) {
        if(this._selectedSet.has(cell))
            this._selectedSet.delete(cell);
        else 
            this._selectedSet.add(cell);
    }

    clearSelectedSet() {
        this._selectedSet.clear();
    }

    validateAndReturnSelection() {
        const targetMissed = [];
        const targetWrong = [];
        const targetCorrect = [];
        for (let key of this._targetSet) {
            if (!this._selectedSet.has(key))
                targetMissed.push(key);
        }
        for (let key of this._selectedSet) {
            if (!this._targetSet.has(key))
                targetWrong.push(key);
            else 
                targetCorrect.push(key);
        }
        return {
            targetMissed: targetMissed,
            targetWrong: targetWrong,
            targetCorrect: targetCorrect
        };
    }
}