import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule} from "@angular/forms";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { HttpClientModule } from '@angular/common/http';
import { VersionService } from './version.service';
import { PositionsmappingService} from "./positionsmapping.service";
import { Player } from './interface/player.interface'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, NgbModule, HttpClientModule],
  providers: [VersionService, PositionsmappingService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit {

  /*
        Main Infos for the Component
   */
  public version: string = '0.0.0'
  public title: string = 'wTicTacToe'

  /*
       Player Variables
   */
  public players: Player[] = []
  public currentPlayer:  string = ''
  public winner: string | null = null;

  /*
       Game Variables
   */
  public board: any[][] = []
  private cancelGame: boolean = false
  private positionsSelector: any = {}
  private winningCells: number[][] | null = null
  private winningLines: number[][][] = [[[]]]
  private positionsMapping : string[] = []
  private levelKeys: string[] = []

  /*
       Option Variables
   */
  private autoRestartIfNoWinner: boolean = true
  private cpuWaitingMax: number = 0
  public levels:number[] = [0, 1, 2, 3, 4]
  public types:{key: string, name:string, description:string}[] = [
    {key: "human", name: "Mensch", description: ""},
    {key: "ki0", name: "KI Level 0", description: ""},
    {key: "ki1", name: "KI Level 1", description: ""},
    {key: "ki2", name: "KI Level 2", description: ""},
    {key: "ki3", name: "KI Level 3", description: ""},
    {key: "ki4", name: "Unbesiegbar", description: ""},
    {key: "ki5", name: "KI Zufall 0", description: "KI wählt bei jedem Zug ein Level aus, wobei aber eher tiefere Levels gewählt werden"},
    {key: "ki6", name: "KI Zufall 1", description: "KI wählt bei jedem Zug ein Level aus, wobei alle Levels werden gleichmässig gewählt"},
    {key: "ki7", name: "KI Zufall 2", description: "KI wählt bei jedem Zug ein Level aus, wobei aber eher höhere Levels gewählt werden"},
    {key: "ki8", name: "KI Zufall 3", description: "KI wählt bei jedem Zug ein Level aus, nahe am unbesiebaren"},

  ]

  /*
       Helper Variables
   */
  public log: any[] = [];

  /*
      Show HTML-Section Variables
   */
  public showProperties: boolean = false
  public showLog: boolean = false

  constructor(private versionService: VersionService, private positionsmappingService: PositionsmappingService)
  {

    this.initVariablesGame()
    this.initVariablesPlayer()
    this.initVariablesHelper()

  }

  public isBoardFull() :boolean {
    for (const row of this.board) {
      for (const cell of row) {
        if (!cell) {
          return false
        }
      }
    }

    return true
  }

  public isWinningCell(i: number, j: number): boolean
  {
    return this.winningCells?.some(cell => cell[0] === i && cell[1] === j) || false
  }

  public makeMove(x: number, y: number, auto: boolean = false, description: string = '') {
    this.cancelGame = false;
    let playerIndex = this.currentPlayer === this.players[0].character ? 0 : 1
    let playerIndexNow = playerIndex === 0 ? 1 : 0;
    if (this.winner !== null)
      return;

    if (this.currentPlayer === this.players[0].character && this.players[0].type.key !== 'human' && !auto)
      return;
    if (this.currentPlayer === this.players[1].character && this.players[1].type.key !== 'human' && !auto)
      return

    if (description === '' && this.players[playerIndex].type.key === 'human')
      description = this.players[playerIndex].type.name

    if (!this.board[x][y]) {
      let position = this.positionsMapping.indexOf(x+"_"+y);
      this.board[x][y] = this.currentPlayer;
      this.players[playerIndex].positions.push(position);
      this.addLog(playerIndex, position.toString(), description)
      if (this.checkWinner()) {
        this.winner = this.currentPlayer === this.players[0].character ? this.players[0].name : this.players[1].name;
        this.addLog(playerIndex, null, 'Gewonnen');
      }
      else if (this.isBoardFull())
        this.addLog(playerIndex, null, 'Unentschieden');
      this.currentPlayer = this.currentPlayer === this.players[0].character ? this.players[1].character : this.players[0].character;

      if (this.currentPlayer === this.players[0].character && this.players[0].type.key !== 'human')
        this.makeAutoMove(this.players[0].type.key);
      else if (this.currentPlayer === this.players[1].character && this.players[1].type.key !== 'human')
        this.makeAutoMove(this.players[1].type.key);
    }
  }

  public newGame(): void
  {
    this.board = Array(3).fill(null).map(() => Array(3).fill(null));
    this.currentPlayer = this.players[0].character;
    this.players[0].positions = new Array<number>()
    this.players[1].positions = new Array<number>()
    this.log = [];
    this.winner = null;
    this.checkWinner(true)
    this.cancelGame = true
    if (this.currentPlayer === this.players[0].character && this.players[0].type.key !== 'human') {
      this.cancelGame = false;
      this.makeAutoMove(this.players[0].type.key);
    }
  }

  public ngOnInit() {
    this.versionService.getVersion().subscribe(
      (data: string) => {
        this.version = data;
      },
      (error) => {
        console.error('Error loading version:', error);
      }
    )

    this.positionsmappingService.get().subscribe(
      (data: any) => {
        let rows = data.split("\n");
        rows.forEach((val:string): void => {
          val = val.trim();
          if (val) {
            let parts = val.split("-");
            let key = parts[0];
            let values = parts.slice(1).map(Number)
            this.positionsSelector[""+key+""] = values;
          }
        })
      },
      (error: any) => {
        console.error('Error loading positionsmapping:', error);
      }
    )

    this.newGame();
  }

  private addLog(playerIndex: number, position: string|null, bemerkung: string = '-') : void
  {
    this.log.push(
      {
        player: this.players[playerIndex].name,
        type: this.players[playerIndex].type.name,
        position: position,
        bemerkung: bemerkung}
    )
  }

  private checkWinner(reset = false): boolean
  {
    const lines = this.winningLines

    for (let line of lines) {
      const [a, b, c] = line

      if (reset) {
        this.winningCells = null
        return false
      } else if (
        this.board[a[0]][a[1]] &&
        this.board[a[0]][a[1]] === this.board[b[0]][b[1]] &&
        this.board[a[0]][a[1]] === this.board[c[0]][c[1]]
      ) {
        this.winningCells = line
        return true
      }
    }

    return false
  }

  private getForceMove(type: string = 'block') : [number, number] | null
  {
    let playerIndex : number = this.currentPlayer === this.players[0].character ? 1 : 0
    if (type === 'win')
      playerIndex = playerIndex === 1 ? 0 : 1

    for (const line of this.winningLines) {
      let counter : number = 0
      let lastEmpty: [number, number] | null = null

      for (const [x, y] of line) {
        const value = this.board[x][y]
        if (value === this.players[playerIndex].character)
          counter++
        else if (!value)
          lastEmpty = [x, y]

      }

      if (counter === 2 && lastEmpty)
        return lastEmpty;

    }

    return null;
  }

  private getPositionLevel0(availablePositions: [number, number][]): [number, number]
  {
    return availablePositions[0]
  }

  private getPositionLevel1(availablePositions: [number, number][]): [number, number]
  {
    const randomIndex = Math.floor(Math.random() * availablePositions.length)
    return availablePositions[randomIndex]
  }

  private getPositionLevel2(availablePositions: [number, number][]): [number, number]
  {
    let lastEmpty = this.getForceMove()

    if (lastEmpty !== null)
      return lastEmpty

    return this.getPositionLevel1(availablePositions)
  }

  private getPositionLevel3(availablePositions: [number, number][]): [number, number]
  {
    let lastEmpty = this.getForceMove('win')

    if (lastEmpty !== null)
      return lastEmpty

    return this.getPositionLevel2(availablePositions)
  }

  private getPositionLevel4(availablePositions: [number, number][]): [number, number]
  {
    let lastEmpty = this.getForceMove('win')
    let positionsSelector = JSON.parse(JSON.stringify(this.positionsSelector))
    if (lastEmpty !== null)
      return lastEmpty

    lastEmpty = this.getForceMove()
    if (lastEmpty !== null)
      return lastEmpty

    let playerIndex = this.currentPlayer === this.players[0].character ? 1 : 0
    let posKey = this.players[playerIndex].positions.sort((a, b) => a -b).join("_")
    let possiblePositions = positionsSelector[posKey]

    if (!possiblePositions || possiblePositions.length === 0)
      return this.getPositionLevel1(availablePositions)

    let randomIndex
    let myPos
    let selectPosition:[number, number]
    let loopExit = false;

    do {
      randomIndex = Math.floor(Math.random() * possiblePositions.length)
      myPos = this.positionsMapping[possiblePositions[randomIndex]]
      selectPosition = myPos.split("_").map(Number) as [number, number]
      possiblePositions.splice(randomIndex, 1)
      loopExit = this.includesArrayInObject(availablePositions, selectPosition) || possiblePositions.length === 0
    } while (!loopExit)

    if (!this.includesArrayInObject(availablePositions, selectPosition))
      return this.getPositionLevel1(availablePositions)

    return selectPosition
  }

  private getRandomLevel(weights: number[]) : string
  {
    let totalWeight = 0;
    for (const weigth of weights)
      totalWeight += weigth;

    let randomNum = Math.random() * totalWeight;

    for (let i = 0; i < this.levelKeys.length; i++) {
      if (randomNum < weights[i])
        return this.levelKeys[i];

      randomNum -= weights[i];
    }

    return this.levelKeys[0];
  }

  private getType(key: string): {key: string, name: string, description: string} | undefined
  {
      return this.types.find(type => type.key === key)
  }

  private includesArrayInObject(obj: any, subArray: any): boolean
  {
    return Object.values(obj).some(arr => Array.isArray(arr) && arr.length === subArray.length && arr.every((value, index) => value === subArray[index]))
  }

  private initVariablesGame() : void
  {
    this.board = [];
    this.cancelGame = false
    this.winningCells = null
    this.levelKeys = ["ki0", "ki1", "ki2", "ki3", "ki4"]
    this.winningLines = [
      // Horizontale Linien
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      // Vertikale Linien
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      // Diagonale Linien
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ]
    this.positionsMapping = ["0_0", "0_1", "0_2", "1_0", "1_1", "1_2", "2_0", "2_1", "2_2"]
  }

  private initVariablesHelper() : void
  {
    this.log = [];
  }

  private initVariablesPlayer() : void
  {
    this.winner = null

    this.players[0] = {
      name: "Player 1",
      character: "X",
      type: this.types[0],
      positions: new Array<number>()
    }

    this.players[1] = {
      name: "Player 2",
      character: "O",
      type: this.types[8],
      positions: new Array<number>()
    }

    this.currentPlayer = this.players[0].character
  }

  async makeAutoMove(type: string):Promise<true>
  {

    if (this.isBoardFull() && !this.winner && this.autoRestartIfNoWinner && this.players[0].type.key !== 'human' && this.players[1].type.key !== 'human')
      this.newGame()

    let availablePositions: [number, number][] = [];
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (!this.board[i][j]) {
          availablePositions.push([i, j])
        }
      }
    }

    if (availablePositions.length > 0)
      switch (type) {
        case "ki5":
          type = this.getRandomLevel([0.4, 0.25, 0.2, 0.1, 0.05]);
          break;
        case "ki6":
          type = this.getRandomLevel([0.2, 0.2, 0.2, 0.2, 0.2]);
          break;
        case "ki7":
          type = this.getRandomLevel([0.05, 0.1, 0.2, 0.25, 0.4]);
          break;
        case "ki8":
          type = this.getRandomLevel([2, 5, 10, 20, 60]);
          break;
      }

      let pos
      switch (type) {
        case 'ki0':
          pos = this.getPositionLevel0(availablePositions)
          break
        case 'ki1':
          pos = this.getPositionLevel1(availablePositions)
          break
        case 'ki2':
          pos = this.getPositionLevel2(availablePositions)
          break
        case 'ki3':
          pos = this.getPositionLevel3(availablePositions)
          break
        case 'ki4':
          pos = this.getPositionLevel4(availablePositions)
          break
        default:
          pos = this.getPositionLevel0(availablePositions)
          break
      }

      if (!this.cancelGame && pos) {
        const [x, y] = pos
        this.makeMove(x, y, true, this.getType(type)?.name)
      }

      return true;
    }

}
