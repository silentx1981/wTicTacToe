import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule} from "@angular/forms";
import {NgbModal, NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { HttpClientModule } from '@angular/common/http';
import { VersionService } from './version.service';
import { Player } from './interface/player.interface'

declare var $: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, NgbModule, HttpClientModule],
  providers: [VersionService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  version: string = '0.0.0';
  title = 'wTicTacToe';
  players: Player[] = [];

  board: any[][];
  currentPlayer: string;
  winner: string | null;
  winningCells: number[][] | null = null
  showProperties: boolean = false;
  cpuWaitingMax: number = 3;
  levels:number[] = [0, 1, 2, 3]
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

  constructor(private modalService: NgbModal, private versionService: VersionService) {
    this.board = [];
    this.winner = null;

    this.players[0] = {
      name: "Player 1",
      character: "X",
      type: "human",
      level: 3,
    }

    this.players[1] = {
      name: "Player 2",
      character: "O",
      type: "cpu",
      level: 3,
    }

    this.currentPlayer = this.players[0].character;

  }

  public open(modal: any): void {
    this.modalService.open(modal);
  }

  getPositionLevel0(availablePositions: [number, number][]): [number, number] {
    return availablePositions[0];
  }

  getPositionLevel1(availablePositions: [number, number][]): [number, number] {
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }

  getPositionLevel2(availablePositions: [number, number][]): [number, number] {
    let playerIndex = this.currentPlayer === this.players[0].character ? 1 : 0;
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

    return this.getPositionLevel1(availablePositions);
  }

  getPositionLevel3(availablePositions: [number, number][]): [number, number] {
    for (const line of this.winningLines) {
      let counter = 0;
      let lastEmpty: [number, number] | null = null;
      for (const [x, y] of line) {
        const value = this.board[x][y];
        if (value === this.currentPlayer) {
          counter++;
        } else if (!value) {
          lastEmpty = [x, y];
        }
      }
      if (counter === 2 && lastEmpty) {
        return lastEmpty;
      }
    }

    return this.getPositionLevel2(availablePositions);
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

    this.newGame();
  }

  newGame() {
    this.board = Array(3).fill(null).map(() => Array(3).fill(null));
    this.currentPlayer = this.players[0].character;
    this.winner = null;
    this.checkWinner(true);
    if (this.currentPlayer === this.players[0].character && this.players[0].type === 'cpu')
      this.makeAutoMove(this.players[0].level);
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
        default:
          pos = this.getPositionLevel0(availablePositions)
          break
      }

      const delay = Math.floor(Math.random() * this.cpuWaitingMax) + 1;
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const [x, y] = pos;
      this.makeMove(x, y, true);
    }

    return true;
  }

  makeMove(x: number, y: number, auto: boolean = false) {
    if (this.winner !== null)
      return;

    if (this.currentPlayer === this.players[0].character && this.players[0].type === 'cpu' && !auto)
      return;
    if (this.currentPlayer === this.players[1].character && this.players[1].type === 'cpu' && !auto)
      return;

    if (!this.board[x][y]) {
      this.board[x][y] = this.currentPlayer;
      if (this.checkWinner()) {
        this.winner = this.currentPlayer === this.players[0].character ? this.players[0].name : this.players[1].name;
      }
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

}
