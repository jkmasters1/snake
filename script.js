const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = 20;
canvas.width = tileCount * gridSize;
canvas.height = tileCount * gridSize;

let snake = [{ x: 10, y: 10 }];
let direction = 'right';
let food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
let score = 0;
let gameOver = false;
const restartButton = document.getElementById('restartButton');
restartButton.addEventListener('click', restartGame);

// 存储排行榜
function saveLeaderboard(leaderboard) {
    localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
}

// 读取排行榜
function loadLeaderboard() {
    const leaderboard = localStorage.getItem('snakeLeaderboard');
    return leaderboard ? JSON.parse(leaderboard) : [];
}

// 更新排行榜
function updateLeaderboard(newScore) {
    let leaderboard = loadLeaderboard();
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b - a);
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }
    saveLeaderboard(leaderboard);
    return leaderboard;
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    direction = 'right';
    food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    score = 0;
    gameOver = false;
    restartButton.style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
}

function draw() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制蛇
    ctx.fillStyle = '#00ff00';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // 绘制食物
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // 显示分数
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText('分数: ' + score, 10, 30);

    if (gameOver) {
        restartButton.style.display = 'block';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2);

        const leaderboard = updateLeaderboard(score);
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '<h2>排行榜</h2>';
        leaderboard.forEach((score, index) => {
            leaderboardElement.innerHTML += `<p>${index + 1}. ${score}</p>`;
        });
        leaderboardElement.style.display = 'block';
    }
}

function update() {
    if (gameOver) return;

    const head = { ...snake[0] };
    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    // 检查游戏结束条件
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
        return;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    } else {
        snake.pop();
    }
}

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
});

gameLoop();