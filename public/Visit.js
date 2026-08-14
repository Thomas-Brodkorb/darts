import { Dart } from './Dart.js';
export class Visit {
    constructor(dart1, dart2, dart3) {
        this.darts = [dart1, dart2, dart3];
    }

    get totalScore() {
        let score = 0;
        for (let i = 0; i < this.darts.length; i++) {
            if (this.darts[i]) {
                score += this.darts[i].value;
            }
        }
        return score;
    }
    toString() {
        return this.darts.map(dart => dart ? dart.value : 'null').join(', ');
    }
    get isComplete() {
        let result = true;
        this.darts.forEach(dart =>
            result &= dart && (dart !== undefined));
        
        return result;
    }
    createDisplayRow() {
        const row = document.createElement('tr');
        this.darts.forEach((dart) => {
            const td = document.createElement('td');
            td.classList.add('align-right');
            td.textContent = dart ? dart.value : '';
            row.appendChild(td);
        });
        return row;
    }
    static createInputRow(errorMessage, goodMessage, provideVisit) {
        const row = document.createElement('tr');
        let dart1 = null;
        let dart2 = null;
        let dart3 = null;
        function setDart1(value) {
            dart1 = value;
            provideVisit(new Visit(dart1, dart2, dart3));
        }
        function setDart2(value) {
            dart2 = value;
            provideVisit(new Visit(dart1, dart2, dart3));
        }
        function setDart3(value) {
            dart3 = value;
            provideVisit(new Visit(dart1, dart2, dart3));
        }
        let setDarts = [setDart1, setDart2, setDart3];

        for (let i = 0; i < 3; i += 1) {
            const td = document.createElement('td');
            const input = Dart.createInputField(errorMessage, goodMessage, setDarts[i]);
            td.appendChild(input);
            row.appendChild(td);
        }
        return row;
    }
}