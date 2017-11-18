import { Component } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent {

  // /*
  sudoku: number[][] = [
    [ 0, 0, 0, 0, 0, 5, 0, 6, 7 ],
    [ 3, 0, 8, 0, 1, 2, 0, 9, 0 ],
    [ 0, 9, 5, 0, 0, 3, 8, 0, 0 ],
    [ 8, 4, 0, 5, 0, 0, 1, 0, 0 ],
    [ 2, 0, 0, 4, 0, 9, 0, 0, 6 ],
    [ 0, 0, 7, 0, 0, 6, 0, 5, 8 ],
    [ 0, 0, 3, 9, 0, 0, 2, 4, 0 ],
    [ 0, 6, 0, 3, 7, 0, 9, 0, 1 ],
    [ 4, 1, 0, 2, 0, 0, 0, 0, 0 ],
  ];
  // */

  completeSudoku: number[][]; // Законченная версия судоку
  cleanedSudoku: number[][];  // Начальная версия судоку для очистки к начальному состоянию

  /*
  sudoku: number[][] = [
    [ 1, 2, 4, 8, 9, 5, 3, 6, 7 ],
    [ 3, 7, 8, 6, 1, 2, 5, 9, 4 ],
    [ 6, 9, 5, 7, 4, 3, 8, 1, 2 ],
    [ 8, 4, 6, 5, 3, 7, 1, 2, 9 ],
    [ 2, 5, 1, 4, 0, 9, 7, 3, 6 ],
    [ 9, 3, 7, 1, 2, 6, 4, 5, 8 ],
    [ 7, 8, 3, 9, 6, 1, 2, 4, 5 ],
    [ 5, 6, 2, 3, 7, 4, 9, 8, 1 ],
    [ 4, 1, 9, 2, 5, 8, 6, 7, 3 ],
  ];
  */


  defaultValuesXY: {x: number, y: number}[];  // Позиции значений по умолчанию

  time: string; // TODO время игры

  values: number[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 ]; // Валидные значения
  possibleMoves: number[]; // Возможные значения для текущей клетки
  errorCounter: number; // Количество ошибок

  previousCell: HTMLElement; // Элемент предыдущей клетки
  currentCell: HTMLElement; // Элемент текущей клетки

  currentValue: number | undefined; // Значение с выбранной клетки
  row: number; // Текущая строка
  col: number; // Текущая колонка

  isComplete = false; // Статус судоку (заполнен или нет)
  hints = false; // Подсказки ходов
  highlight = true; // Подсветка одинаковых значений

  constructor() {
    this.init();
  }

  init(): void {
    this.cleanedSudoku = JSON.parse(JSON.stringify(this.sudoku)); // Создание копии начального массива

    this.completeSudoku = JSON.parse(JSON.stringify(this.sudoku)); // Создание копии начального массива

    while (!this.checkCompletion(this.completeSudoku)) { // Проверка заполненности финальной версии
      this.solveSudoku(); // Заполнение судоку
    }

    console.log('finished!');
    console.log(this.completeSudoku);

    // Сохранение позиций значений по умолчанию
    this.defineDefaultValues();

    this.errorCounter = 0;
  }

  defineDefaultValues(): void {
    this.defaultValuesXY = [];
    console.log('INIT ');
    console.log(this.defaultValuesXY);
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.sudoku[i][j]) {
          this.defaultValuesXY.push({ x: i, y: j});
        }
      }
    }
  }

  /*
  * Выбор клетки судоку
  * @param {number}       value    значение с клетки
  * @param {number}       row      индекс строки в массиве
  * @param {number}       col      индекс колонки в массиве
  * @param {HTMLElement}  target   элемент вызвавший метод
  * @returns void
   */
  selectCell(value: number, row: number, col: number, target: HTMLElement): void {
    // console.log( `Value: ${value} Row: ${row} Col: ${col}` );
    // console.log(`CURRENT VALUE IS: ${this.currentValue}`);

    this.currentValue = value;

    // удаление выделения у предыдущей клетки
    if (this.previousCell) {
      this.previousCell.classList.remove('selected-cell');
    }

    // Если выбранная клеткая хранит значение по умолчанию
    // то прекращаем выполнение функции
    if (this.isDefaultValue(row, col)) {
      console.warn('DEFAULT VALUE');
      return ;
    }

    // Обновление текущей позции
    this.row = row;
    this.col = col;

    // Присваивание новой текущей клетки
    this.currentCell = target;
    this.currentCell.classList.add('selected-cell');

    this.previousCell = target;

    // Определить возможные значения для текущей позиции в игровом массиве
    this.possibleMoves = this.definePossibleMoves(row, col, this.sudoku);
  }

  /*
     define possible moves for corresponding position (row x col)
     * @param {number}    row     индекс строки в массиве
     * @param {number}    col     индекс колонки в массиве
     * @param {number[]}  array
     *
     * @returns {number[]} Возвращает массив возможных значений для данной позиции
  */
  definePossibleMoves(row: number, col: number, array: number[][]): number[] {
    this.row = row;
    this.col = col;

    const possibleMoves: Set<number> = new Set(this.values); // сет со всеми валидными значениями

    // Собираем значения с текущей строки, колонки и подквадрата как нелегальные значения
    const illegalValues: Set<number> = this.defineCurrentValues(array);

    // Удаляем использованные значения из сета всех возможных значений
    possibleMoves.forEach( value => {
      if ( illegalValues.has(value) ) {
        possibleMoves.delete(value);
      }
    });

    const result = [];
    possibleMoves.forEach( value => result.push(value) );  // Конвертирование из Set в Array
    result.push(0); // Добавляем 0 для отмены хода
    return result;
  }

  /*
  * Присваивание значения массиву СУДОКУ
  * @param  {number} value  Присваиваемое значение
  * @returns {void}
   */
  setValue(value: number): void {
    if (this.isValidValue(this.sudoku, value)) {
      this.currentCell.classList.remove('selected-cell');
      this.previousCell.classList.remove('selected-cell');
      this.sudoku[this.row][this.col] = value;
      this.possibleMoves = [];

      this.checkError(value); // Сверяем присвоеное значение со значением в заполненом массиве СУДОКУ

      this.isComplete = this.checkCompletion(this.sudoku); // Проверяем заполненость игровой доски

      if (this.isComplete) { this.ending(); }
    }
  }

  /*
  * Проверка валидности значения дла текущей позиции заданного массива
  * @param {number[][]} array  Массив для проверки
  * @param {number}     value  Проверяемое значение
  * @return {boolean}   TRUE если значение валидно для текущей позиции, иначе FALSE
   */
  isValidValue(array: number[][], value: number): boolean {
    if (value === 0) {
      return true;
    }

    const illegalValues: Set<number> = this.defineCurrentValues(array);

    // Если данное значение присутствует в сете то возращаем FALSE
    return !illegalValues.has(value);
  }

  /*
  * Собираем значения с текущей строки, колонки и подвквдрата
  * @param {number[][]}     array   массив с которого мы собираем значение
  * @returns {Set<number>}          возвращаем собранные значения
   */
  defineCurrentValues(array: number[][]): Set<number> {
    // пустые сеты для текущей строки, колонки и подквадрата
    const rows: Set<number> = new Set();
    const cols: Set<number> = new Set();
    const squares: Set<number> = new Set();

    // совместеный сет со строки, колонки и подквадрата
    const currentValues: Set<number> = new Set();


    // Собираем значения с текущей строки массива судоку
    for (let i = 0; i < 9; i++) {
      rows.add(array[i][this.col]);
    }

    // Собираем значения с текущей колонки массива судоку
    for (let i = 0; i < 9; i++) {
      cols.add(array[this.row][i]);
    }


    // Высчитываем начальную позицию подквадрата
    const startRow = Math.floor(this.row / 3) * 3;
    const startCol = Math.floor(this.col / 3) * 3;

    // Собираем значения с текущего подквадрата
    for (let i = startRow; i < startRow + 3; i++) {
      for (let j = startCol; j < startCol + 3; j++) {
        squares.add(array[i][j]);
      }
    }

    // собираем уникальные значения со строки, колонки и подквадрата в один сет
    rows.forEach( value => currentValues.add(value) );
    cols.forEach( value => currentValues.add(value) );
    squares.forEach( value => currentValues.add(value) );

    return currentValues;
  }

  /*
  * Переключение состояния отвечающего за отображение Возможных ходов
  * @param {HTMLElement} target элемент меню у которого будем включать и выключать подсвечивание
  * @returns {void}
   */
  showHints(target: HTMLElement): void {
    this.hints = !this.hints;

    if (this.hints) {
      target.classList.add('selected-cell');
    } else {
      target.classList.remove('selected-cell');
    }
  }

  /*
  * Проверка массива на заполненность
  * @params   {number[][]}  arrray  Проверяемый массив
  * @returns  {boolean}  FALSE если в массиве присутствует 0
   */
  checkCompletion(array: number[][]): boolean {
    for (let i = 0; i < 9; i++) {
      if (array[i].indexOf(0) !== -1) {
        return false;
      }
    }
    return true;
  }

  /*
  * Метод вызываемый когда игровой массив полностью заполнен
  * В результате все ячейки массива обнуляются
  * @returns {void}
   */
  ending(): void {
    let row = 0;
    let col = 0;
    let counter = 0;
    const timer = setInterval(
      () => {

        if (counter >= 81) {
          clearInterval(timer);
          this.constructor();
          return;
        }

        this.sudoku[row][col] = 0;
        col++;
        if (col === 9) {
          col = 0;
          row++;
        }

        counter++;
      },
          50);


  }

  // TODO подсчет времени игры
  start(): void {
  }

  /*
  * Заполняет массив валидными значениями
  * @returns {void}
  */
  solveSudoku(): void {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!this.completeSudoku[i][j]) { // Если значение равно 0

          // Собираем валидные значения для текущей позиции
          const possible = this.definePossibleMoves(i, j, this.completeSudoku);

          // Если здесь всего два значения последнее значение всегда равно 0
          // Присваиваем не нулевое значение
          if (possible.length === 2) {  this.completeSudoku[i][j] = possible[0];  }
        }

      }
    }

  }

  /*
  * Сверяем значение в решенной версии массива судоку
  * Если значение не равны то увеличиваем счетчик ошибок
  * @params   {number}  value   Присвоенное значение
  * @returns  {void}
   */
  checkError(value: number): void {
    if (this.completeSudoku[this.row][this.col] !== value) {
      this.errorCounter++;
    }
  }

  /*
  * Сбрасываем значение массива судоку на начальные и обнуляем счетчик ошибок
   */
  resetSudoku(): void {
    this.errorCounter = 0;
    this.sudoku = JSON.parse(JSON.stringify(this.cleanedSudoku));
  }

  /*
  * Включаем / Выключаем подсветку похожих значений на игровой доске
   */
  changeHighlight(): void {
    this.highlight = !this.highlight;
  }

  generateSudoku(difficulty: number): void {

    let counter = 0;
    let asd = 0;
    let result =  [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                  ];

    const numOfDefaultValues =  difficulty === 1 ? 47 :
                                difficulty === 2 ? 38 :
                                difficulty === 3 ? 22 : 0;

    // Если уровень сложности не определен завершаем выполнение функции
    if (!numOfDefaultValues) {
      console.log('The difficulty level is not defined');
      return;
    }

    while (counter <= numOfDefaultValues) {
      const randomRow = Math.floor( Math.random() * 9); // 0 - 8
      const randomCol = Math.floor( Math.random() * 9); // 0 - 8
      const randomValue = Math.floor( Math.random() * 9 + 1); // 1 - 9

      this.row = randomRow;
      this.col = randomCol;

      if (this.isValidValue(result, randomValue)) {
        // console.log(result);
        // console.log(randomRow, randomCol, randomValue);
        // console.log(asd);
        result[randomRow][randomCol] = randomValue;
        counter++;
        asd++;
        console.log(randomValue);
        console.log(`COUNTER ${counter}`);
      }
    }

    this.sudoku = JSON.parse( JSON.stringify(result) );

    this.defineDefaultValues();
    // this.init();

    // console.log('NEW SUDOKU');
    // console.log(this.sudoku);
    // console.log('SOLUTION');
    // console.log(this.completeSudoku);


  }

  /*
  * @param    {number}    r   индекс строки
  * @param    {number}    c   индекс колонки
  * @returns  {boolean}       TRUE если значение по умолчанию
   */
  isDefaultValue(r: number, c: number): boolean {
    for (const item of this.defaultValuesXY) {
      if (item.x === r && item.y === c) {
        return true;
      }
    }
    return false;
  }


}
