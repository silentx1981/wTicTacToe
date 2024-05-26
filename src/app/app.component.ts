import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule} from "@angular/forms";
import {NgbModal, NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { HttpClientModule } from '@angular/common/http';
import { VersionService } from './version.service';
import { PositionsmappingService} from "./positionsmapping.service";
import { Player } from './interface/player.interface'
import {last} from "rxjs";

declare var $: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, NgbModule, HttpClientModule],
  providers: [VersionService, PositionsmappingService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  version: string = '0.0.0';
  title = 'wTicTacToe';
  players: Player[] = []
  cancelGame: boolean = false;
  positionsSelector: any = [];
  log: any[] = [];

  board: any[][];
  currentPlayer: string;
  winner: string | null;
  winningCells: number[][] | null = null
  showProperties: boolean = false
  showLog: boolean = false
  cpuWaitingMax: number = 0; //3;
  levels:number[] = [0, 1, 2, 3, 4]
  types:string[] = ["human", "cpu"]
  winningLines = [
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
  ];
  positionsMapping = ["0_0", "0_1", "0_2", "1_0", "1_1", "1_2", "2_0", "2_1", "2_2"];

  constructor(private modalService: NgbModal, private versionService: VersionService, private positionsmappingService: PositionsmappingService) {
    this.board = [];
    this.winner = null;
    this.cancelGame = false
    this.positionsSelector = [];
    this.log = [];

    this.players[0] = {
      name: "Player 1",
      character: "X",
      type: "human",
      level: 4,
      positions: new Array<number>()
    }

    this.players[1] = {
      name: "Player 2",
      character: "O",
      type: "cpu",
      level: 4,
      positions: new Array<number>()
    }

    this.currentPlayer = this.players[0].character;

  }

  public open(modal: any): void {
    this.modalService.open(modal);
  }

  getBlocker(win: boolean = false): [number, number] | null {
    let playerIndex = this.currentPlayer === this.players[0].character ? 1 : 0
    if (win)
      playerIndex = playerIndex === 1 ? 0 : 1;

    for (const line of this.winningLines) {
      let counter = 0;
      let lastEmpty: [number, number] | null = null;
      for (const [x, y] of line) {
        const value = this.board[x][y];
        if (value === this.players[playerIndex].character) {
          counter++;
        } else if (!value) {
          lastEmpty = [x, y];
        }
      }
      if (counter === 2 && lastEmpty) {
        return lastEmpty;
      }
    }

    return null;
  }

  getPositionLevel0(availablePositions: [number, number][]): [number, number] {
    return availablePositions[0];
  }

  getPositionLevel1(availablePositions: [number, number][]): [number, number] {
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }

  getPositionLevel2(availablePositions: [number, number][]): [number, number] {
    let lastEmpty = this.getBlocker();

    if (lastEmpty !== null)
      return lastEmpty;

    return this.getPositionLevel1(availablePositions);
  }

  getPositionLevel3(availablePositions: [number, number][]): [number, number] {
    let lastEmpty = this.getBlocker(true);

    if (lastEmpty !== null)
      return lastEmpty;

    return this.getPositionLevel2(availablePositions);
  }

  getPositionLevel4(availablePositions: [number, number][]): [number, number] {
    let lastEmpty = this.getBlocker(true);
    if (lastEmpty !== null)
      return lastEmpty;

    lastEmpty = this.getBlocker()
    if (lastEmpty !== null)
      return lastEmpty;

    let playerIndex = this.currentPlayer === this.players[0].character ? 1 : 0
    let posKey = this.players[playerIndex].positions.sort((a, b) => a -b).join("_");
    let possiblePositions = this.positionsSelector[posKey];

    if (!possiblePositions)
      return this.getPositionLevel1(availablePositions);

    let randomIndex = Math.floor(Math.random() * possiblePositions.length);
    let myPos = this.positionsMapping[possiblePositions[randomIndex]];
    let selectPosition:[number, number] = myPos.split("_").map(Number) as [number, number];
    return selectPosition;

    return this.getPositionLevel1(availablePositions);
  }

  ngOnInit() {
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
            let values = parts.slice(1).map(Number);
            this.positionsSelector[key] = values;
          }
        })
      },
      (error: any) => {
        console.error('Error loading positionsmapping:', error);
      }
    )

    console.log(this.positionsSelector);

    this.newGame();
  }

  newGame() {
    this.board = Array(3).fill(null).map(() => Array(3).fill(null));
    this.currentPlayer = this.players[0].character;
    this.players[0].positions = [];
    this.players[0].positions = [];
    this.log = [];
    this.winner = null;
    this.checkWinner(true)
    this.cancelGame = true;
    if (this.currentPlayer === this.players[0].character && this.players[0].type === 'cpu') {
      this.cancelGame = false;
      this.makeAutoMove(this.players[0].level);
    }
  }

  async makeAutoMove(level: number):Promise<true> {
    let availablePositions: [number, number][] = [];
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (!this.board[i][j]) {
          availablePositions.push([i, j]);
        }
      }
    }

    if (availablePositions.length > 0) {
      let pos;
      switch (level) {
        case 0:
          pos = this.getPositionLevel0(availablePositions)
          break
        case 1:
          pos = this.getPositionLevel1(availablePositions)
          break
        case 2:
          pos = this.getPositionLevel2(availablePositions)
          break
        case 3:
          pos = this.getPositionLevel3(availablePositions)
          break
        case 4:
          pos = this.getPositionLevel4(availablePositions)
          break
        default:
          pos = this.getPositionLevel0(availablePositions)
          break
      }

      const delay = this.cpuWaitingMax > 0 ? Math.floor(Math.random() * this.cpuWaitingMax) + 1 : 0;
      await new Promise(resolve => setTimeout(resolve, delay * 1000))
      if (!this.cancelGame) {
        const [x, y] = pos;
        this.makeMove(x, y, true);
      }

    }

    return true;
  }

  makeMove(x: number, y: number, auto: boolean = false) {
    this.cancelGame = false;
    let playerIndex = this.currentPlayer === this.players[0].character ? 0 : 1
    if (this.winner !== null)
      return;

    if (this.currentPlayer === this.players[0].character && this.players[0].type === 'cpu' && !auto)
      return;
    if (this.currentPlayer === this.players[1].character && this.players[1].type === 'cpu' && !auto)
      return;

    if (!this.board[x][y]) {
      let position = this.positionsMapping.indexOf(x+"_"+y);
      this.board[x][y] = this.currentPlayer;
      this.players[playerIndex].positions.push(position);
      this.addLog(playerIndex, position.toString())
      if (this.checkWinner()) {
        this.winner = this.currentPlayer === this.players[0].character ? this.players[0].name : this.players[1].name;
        this.addLog(playerIndex, null, 'Gewonnen');
      }
      else if (this.isBoardFull())
        this.addLog(playerIndex, null, 'Unentschieden');
      this.currentPlayer = this.currentPlayer === this.players[0].character ? this.players[1].character : this.players[0].character;

      if (this.currentPlayer === this.players[0].character && this.players[0].type === 'cpu')
        this.makeAutoMove(this.players[0].level);
      else if (this.currentPlayer === this.players[1].character && this.players[1].type === 'cpu')
        this.makeAutoMove(this.players[1].level);
    }
  }

  checkWinner(reset = false): boolean {
    const lines = this.winningLines;

    for (let line of lines) {
      const [a, b, c] = line;

      if (reset) {
        this.winningCells = null;
        return false;
      } else if (
        this.board[a[0]][a[1]] &&
        this.board[a[0]][a[1]] === this.board[b[0]][b[1]] &&
        this.board[a[0]][a[1]] === this.board[c[0]][c[1]]
      ) {
        this.winningCells = line;
        return true;
      }
    }

    return false;
  }

  isWinningCell(i: number, j: number): boolean {
    return this.winningCells?.some(cell => cell[0] === i && cell[1] === j) || false;
  }

  isBoardFull() :boolean {
    for (const row of this.board) {
      for (const cell of row) {
        if (!cell) {
          return false;
        }
      }
    }

    return true;
  }

  addLog(playerIndex: number, position: string|null, bemerkung: string = '-')
  {
    this.log.push(
      {
        player: this.players[playerIndex].name,
        type: this.players[playerIndex].type,
        level: this.players[playerIndex].level,
        position: position,
        bemerkung: bemerkung}
    );
  }

}
