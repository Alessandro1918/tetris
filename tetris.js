const SCREEN_WIDTH = 10
const SCREEN_LENGTH = 20

const white = "\x1b[0m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const blue = "\x1b[34m"
const colors = [white, red, green, yellow, blue]

//Init screen
const screen = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [1, 1, 0, 2, 2, 3, 0, 4, 0, 0],
  [1, 1, 2, 2, 0, 3, 4, 4, 4, 0],
]
// const screen = []
// for (var j = 0; j < SCREEN_LENGTH; j++) {
//   const line = []
//   for (var i = 0; i < SCREEN_WIDTH; i++) {
//     const cell = 0
//     line.push(cell)
//   }
//   screen.push(line)
// }

//Print the board, cell by cell.
function printBoard() {
  for (var j = 0; j < SCREEN_LENGTH; j++) {
    for (var i = 0; i < SCREEN_WIDTH; i++) {
      if (screen[j][i]) {
        process.stdout.write(colors[screen[j][i]] + "██" + white)
      } else {
        process.stdout.write("--")
      }
    }
    process.stdout.write("\n")
  }
}

printBoard()