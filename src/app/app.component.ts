import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule} from "@angular/forms";
import {NgbModal, NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { HttpClientModule } from '@angular/common/http';
import { VersionService } from './version.service';

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

  board: any[][];
  currentPlayer: string;
  winner: string | null;
  winningCells: number[][] | null = null;
  player1: string = 'Player 1';
  player2: string = 'Player 2';
  charPlayer1: string = 'X';
  charPlayer2: string = 'O';
  typePlayer1: string = 'human';
  typePlayer2: string = 'cpu';

  constructor(private modalService: NgbModal, private versionService: VersionService) {
    this.board = [];
    this.currentPlayer = this.charPlayer1;
    this.winner = null;
  }

  public open(modal: any): void {
    this.modalService.open(modal);
  }

  ngOnInit() {
    this.versionService.getVersion().subscribe(
      (data: string) => {
        this.version = data;
      },
      (error) => {
        console.error('Error loading version:', error);
      }
    );

    this.newGame();
  }

  newGame() {
    this.board = Array(3).fill(null).map(() => Array(3).fill(null));
    this.currentPlayer = this.charPlayer1;
    this.winner = null;
    this.checkWinner(true);
  }

  makeAutoMove() {
    let availablePositions = [];
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (!this.board[i][j]) {
          availablePositions.push([i, j]);
        }
      }
    }

    if (availablePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      const [x, y] = availablePositions[randomIndex];
      this.makeMove(x, y);
    }

  }

  makeMove(x: number, y: number) {
    if (this.winner !== null)
      return;

    if (!this.board[x][y]) {
      this.board[x][y] = this.currentPlayer;
      if (this.checkWinner()) {
        this.winner = this.currentPlayer === this.charPlayer1 ? this.player1 : this.player2;
      }
      this.currentPlayer = this.currentPlayer === this.charPlayer1 ? this.charPlayer2 : this.charPlayer1;

      if (this.currentPlayer === this.charPlayer1 && this.typePlayer1 === 'cpu')
        this.makeAutoMove();
      else if (this.currentPlayer === this.charPlayer2 && this.typePlayer2 === 'cpu')
        this.makeAutoMove();

    }
  }

  checkWinner(reset = false): boolean {
    const lines = [
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

}
