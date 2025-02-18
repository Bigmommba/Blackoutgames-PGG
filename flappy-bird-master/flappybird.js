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

// Pipe spawn timing (dynamic)
let pipeSpawnRate = 1200; // Initial spawn rate in ms
let minPipeSpawnRate = 400; // Minimum spawn interval
let pipeSpawnDecay = 10; // How much time decreases per spawn

// Sound effects
let deathSound = new Audio("./death.wav");
let alternativeSound = new Audio("./sfx_hit.wav"); // Use sfx_die.wav as the alternative sound
let playDeathSound = false; // Default: Do not play sound

// New paused flag
let paused = false;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    birdImg = new Image();
    birdImg.src = "./flappybird.gif";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    showStartMenu();

    document.addEventListener("keydown", startGame);
    document.addEventListener("keydown", moveBird);

    // Pause and unpause the game when 'P' is pressed
    document.addEventListener("keydown", function (e) {
        if (e.code === "KeyP") {
            paused = !paused; // Toggle pause state
            if (paused) {
                showPauseMenu(); // Show the pause menu
            } else {
                update(); // Resume the game
            }
        }
    });
};

function showStartMenu() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "black";
    context.font = "30px sans-serif";
    context.fillText("Welcome to Flappy Bird!", boardWidth / 4, boardHeight / 3);
    context.font = "25px sans-serif";
    context.fillText("Press SPACE or UP ARROW to Start", boardWidth / 4, boardHeight / 2);
    context.fillText("High Score: " + highScore, boardWidth / 4, boardHeight / 1.5);

    // Create slider for toggling sound
    let sliderContainer = document.createElement("div");
    sliderContainer.style.position = "absolute";
    sliderContainer.style.bottom = "20px";
    sliderContainer.style.left = "90%";
    sliderContainer.style.transform = "translateX(-50%)";
    sliderContainer.style.textAlign = "center";
    sliderContainer.style.fontSize = "16px";
    sliderContainer.style.color = "white";
    sliderContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    sliderContainer.style.padding = "10px";
    sliderContainer.style.borderRadius = "8px";

    let sliderLabel = document.createElement("span");
    sliderLabel.textContent = "Risky Death Sound: OFF";
    sliderLabel.style.marginRight = "10px";

    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.value = playDeathSound ? "1" : "0";
    slider.style.cursor = "pointer";

    slider.oninput = function () {
        playDeathSound = this.value === "1";
        sliderLabel.textContent = "Risky Death Sound: " + (playDeathSound ? "ON" : "OFF");
    };

    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(slider);
    document.body.appendChild(sliderContainer);
}

function startGame(e) {
    if (gameStarted || paused) return;  // If paused, don't start the game

    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyW") {
        gameStarted = true;
        gameOver = false;
        score = 0;
        bird.y = birdY;
        pipeArray = [];

        // Reset pipe spawn rate to default when restarting
        pipeSpawnRate = 1200;

        // Start dynamically spawning pipes
        setInterval(spawnPipesWithDecay, pipeSpawnRate);  // Use setInterval to continuously spawn pipes

        requestAnimationFrame(update);
    }
}

function update() {
    if (!gameStarted || paused) return; // Don't update game if paused
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
        // Play appropriate sound based on toggle
        if (playDeathSound) {
            deathSound.play();
        } else {
            alternativeSound.play(); // Play sfx_die.wav if death sound is off
        }

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
        pipeSpawnRate = 1200;
        dynamicOpeningSpace = 200;
    }
}

// New function to show the pause menu
function showPauseMenu() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "rgba(0, 0, 0, 0.5)";  // Semi-transparent background
    context.fillRect(0, 0, board.width, board.height);
    context.fillStyle = "white";
    context.font = "40px sans-serif";
    context.fillText("Paused", boardWidth / 2 - 60, boardHeight / 3);
    context.font = "25px sans-serif";
    context.fillText("Press P to Resume", boardWidth / 2 - 80, boardHeight / 2);
    context.fillText("Press SPACE or UP ARROW to Restart", boardWidth / 2 - 120, boardHeight / 1.7);
}

let dynamicOpeningSpace = 200;  // Start with a larger gap

function placePipes() {
    if (gameOver || paused) return;

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    
    // Decrease the opening space over time to make pipes closer
    dynamicOpeningSpace = Math.max(dynamicOpeningSpace - 1, 50); // Keeps it above 50px

    let topPipe = { img: topPipeImg, x: pipeX, y: randomPipeY, width: pipeWidth, height: pipeHeight, passed: false };
    pipeArray.push(topPipe);

    let bottomPipe = { img: bottomPipeImg, x: pipeX, y: randomPipeY + pipeHeight + dynamicOpeningSpace, width: pipeWidth, height: pipeHeight, passed: false };
    pipeArray.push(bottomPipe);
}

function spawnPipesWithDecay() {
    if (gameOver || paused) return;

    placePipes();

    // Decrease spawn rate over time but not below the minimum
    pipeSpawnRate = Math.max(pipeSpawnRate - pipeSpawnDecay, minPipeSpawnRate);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyW") {
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
