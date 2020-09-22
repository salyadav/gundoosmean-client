export default class ScoreCard {
    constructor(scored=0, missed=0, wronged=0) {
        this._scored = scored;
        this._missed = missed;
        this._wronged = wronged;
    }

    get scored() {
        return this._scored;
    }

    get missed() {
        return this._missed;
    }

    get wronged() {
        return this._wronged;
    }

    set scored(score) {
        this._scored = score;
    }

    set missed(missed) {
        this._missed = missed;
    }

    set wronged(wronged) {
        this._wronged = wronged;
    }

    incrementScored(count) {
        this._scored+=count;
    }

    incrementMissed(count) {
        this._missed+=count;
    }

    incrementWronged(count) {
        this._wronged+=count;
    }

    reset() {
        this._scored = 0;
        this._missed = 0;
        this._wronged = 0;
    }
}