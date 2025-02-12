//board
let board;
let boardWidth = 750;
let boardHeight = 620;
let context;

//bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -4;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameStarted = false;

// Gradual speed-up
let pipeSpeedIncreaseRate = 0.0001;
let maxPipeSpeed = -30;

// Sound effect
let deathSound = new Audio("./sfx_hit.wav");

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    showStartMenu();

    document.addEventListener("keydown", startGame);
    document.addEventListener("keydown", moveBird);
};

function showStartMenu() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "black";
    context.font = "30px sans-serif";
    context.fillText("Welcome to Flappy Bird!", boardWidth / 4, boardHeight / 3);
    context.font = "25px sans-serif";
    context.fillText("Press SPACE or UP ARROW to Start", boardWidth / 4, boardHeight / 2);
    context.fillText("High Score: " + highScore, boardWidth / 4, boardHeight / 1.5);
}

function startGame(e) {
    if (gameStarted) return;
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        gameStarted = true;
        gameOver = false;
        score = 0;
        bird.y = birdY;
        pipeArray = [];
        setInterval(placePipes, 1200);
        requestAnimationFrame(update);
    }
}

function update() {
    if (!gameStarted) return;
    requestAnimationFrame(update);
    if (gameOver) return;

    context.clearRect(0, 0, board.width, board.height);

    if (velocityX > maxPipeSpeed) {
        velocityX -= pipeSpeedIncreaseRate;
    }

    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) gameOver = true;

    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) gameOver = true;
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    context.fillStyle = "Black";
    context.font = "20px sans-serif";
    context.fillText("Score: " + score, 5, 45);
    context.fillText("High Score: " + highScore, 5, 90);

    if (gameOver) {
        // Play death sound
        deathSound.play();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }
        context.fillStyle = "red";
        context.clearRect(0, 0, board.width, board.height);
        context.font = "30px sans-serif";
        context.fillText("Game over!", boardWidth / 4, boardHeight / 3);
        context.font = "20px sans-serif";
        context.fillText("Press SPACE or UP ARROW to Restart", boardWidth / 4, boardHeight / 2);
        context.fillText("Score: " + score, boardWidth / 4, boardHeight / 1.7);
        context.fillText("High Score: " + highScore, boardWidth / 4, boardHeight / 1.5);
    }
}

function placePipes() {
    if (gameOver) return;

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = { img: topPipeImg, x: pipeX, y: randomPipeY, width: pipeWidth, height: pipeHeight, passed: false };
    pipeArray.push(topPipe);

    let bottomPipe = { img: bottomPipeImg, x: pipeX, y: randomPipeY + pipeHeight + openingSpace, width: pipeWidth, height: pipeHeight, passed: false };
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        velocityY = -6;

        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
