export default class LevelGenerator {
    constructor(level, targetCount) {
        this._level = level;
        // this._targetCount = targetCount;
        this._gridSize = this._generateGridSize(level);
        this._targetLocations = this._generateTargetLocations(targetCount);
        this._displayTime = this._generateDisplayTime(level);
    }

    get level() {
        return this._level;
    }

    // get targetCount() {
    //     return this._targetCount;
    // }

    get gridSize() {
        return this._gridSize;
    }

    get targetLocations() {
        return this._targetLocations;
    }

    get displayTime() {
        return this._displayTime;
    }

    set level(level) {
        this._level = level;
    }

    // set targetCount(targetCount) {
    //     this._targetCount = targetCount;
    // }

    set gridSize(gridSize) {
        this._gridSize = gridSize;
    }

    set targetLocations(targetLocations) {
        this._targetLocations = targetLocations;
    }

    set displayTime(displayTime) {
        this._displayTime = displayTime;
    }

    _generateDisplayTime(level) {
        if (level==1) {
            return 1200;
        } else if(level<=6) {
            return Math.floor((level - 1)/4 + 1)*800;
        } else if (level < 14) {
            return Math.floor((level - 1)/4 + 1)*500;
        } else {
            return 4000;
        }
    }

    _generateTargetLocations(targetCount, level) {
        // const gridSize = _generateGridSize(level);
        const targetSet = new Set();
        while(targetSet.size!==targetCount) {
            const limit = this._gridSize*this._gridSize;
            targetSet.add(
                Math.floor(Math.random()*limit)
            );
        }
        return targetSet;
    }

    _generateGridSize(level) {
        if(level <= 20) {
            return Math.floor((level+1)/2 + 3);
        } else {
            return 14;
        }
    }
}