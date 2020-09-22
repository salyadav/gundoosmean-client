export default class CheckboxGrid {
    constructor(row, column) {
        this._row = row;
        this._column = column;
    }
    get row() {
        return this._row;
    }

    get column() {
        return this._column;
    }

    set row(row) {
        this._row = row;
    }

    set column(column) {
        this._column = column;
    }

    constructGrid() {
        let grid = document.createElement('div');
        grid.setAttribute('id', 'game-grid');
        grid.setAttribute('class', 'game-grid');
        for (let i=0; i<this._row*this._column; i++) { 
            let el = document.createElement('div');
            el.setAttribute('class', 'grid-cell cell-image');
            el.setAttribute('id', 'gridid_'+i);
            // el.innerText = i+1;
            grid.appendChild(el);
        }

        const gridstyle=`
            grid-template-columns: repeat(${this.row}, auto);
            grid-template-rows: repeat(${this.column}, auto);
        `;
        grid.setAttribute('style', gridstyle);
        return grid;
    }

    destructGrid(parentNode) {
        const node = document.getElementById('game-grid');
        if (node) 
            parentNode.removeChild(node);
    }
}